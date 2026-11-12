/* =========================================================
   PAINTRA — shared artwork catalogue
   One source of truth for the collection, prices and editions
   ========================================================= */

(function () {
  "use strict";

  var images = [
    // aiartman
    "aiartman__14050821_134814396.jpg",
    "aiartman__14050821_134814772.jpg",
    "aiartman__14050821_134815272.jpg",
    "aiartman__14050821_134815772.jpg",
    "aiartman__14050821_134816272.jpg",
    "aiartman__14050821_134816771.jpg",
    "aiartman__14050821_134817271.jpg",
    // celistima
    "celistima_14050821_132620834.jpg",
    "celistima_14050821_132621235.jpg",
    "celistima_14050821_132621732.jpg",
    "celistima_14050821_132622230.jpg",
    "celistima_14050821_132622744.jpg",
    "celistima_14050821_132623229.jpg",
    "celistima_14050821_132623729.jpg",
    "celistima_14050821_132624229.jpg",
    "celistima_14050821_132624729.jpg",
    "celistima_14050821_132625314.jpg",
    // fantasy_ai_author
    "fantasy_ai_author_14050821_125310522.jpg",
    "fantasy_ai_author_14050821_125310925.jpg",
    "fantasy_ai_author_14050821_125311473.jpg",
    "fantasy_ai_author_14050821_125311923.jpg",
    "fantasy_ai_author_14050821_125312422.jpg",
    "fantasy_ai_author_14050821_125312922.jpg",
    "fantasy_ai_author_14050821_125313423.jpg",
    "fantasy_ai_author_14050821_125313923.jpg",
    "fantasy_ai_author_14050821_125314423.jpg",
    "fantasy_ai_author_14050821_125314926.jpg",
    "fantasy_ai_author_14050821_125315565.jpg",
    "fantasy_ai_author_14050821_125315926.jpg",
    "fantasy_ai_author_14050821_125316430.jpg",
    "fantasy_ai_author_14050821_125316926.jpg",
    "fantasy_ai_author_14050821_125317431.jpg",
    "fantasy_ai_author_14050821_125317933.jpg",
    "fantasy_ai_author_14050821_125318431.jpg",
    "fantasy_ai_author_14050821_125318934.jpg",
    "fantasy_ai_author_14050821_125319435.jpg",
    "fantasy_ai_author_14050821_125319931.jpg",
    // lofipromt
    "lofipromt_14050821_125822454.jpg",
    "lofipromt_14050821_125822883.jpg",
    "lofipromt_14050821_125823384.jpg",
    "lofipromt_14050821_125823886.jpg",
    "lofipromt_14050821_125824388.jpg",
    "lofipromt_14050821_125824887.jpg",
    "lofipromt_14050821_125825386.jpg",
    "lofipromt_14050821_125825883.jpg",
    "lofipromt_14050821_125826389.jpg",
    // maxvoao
    "maxvoao_14050821_125952853.jpg",
    "maxvoao_14050821_125953260.jpg",
    "maxvoao_14050821_125953765.jpg",
    "maxvoao_14050821_125954261.jpg",
    "maxvoao_14050821_125954764.jpg",
    "maxvoao_14050821_125955263.jpg",
    "maxvoao_14050821_125955767.jpg",
    "maxvoao_14050821_125956264.jpg",
    "maxvoao_14050821_125956786.jpg",
    "maxvoao_14050821_125957263.jpg",
    "maxvoao_14050821_125957763.jpg",
    "maxvoao_14050821_125958267.jpg",
    "maxvoao_14050821_125958785.jpg",
    "maxvoao_14050821_125959762.jpg",
    "maxvoao_14050821_130000263.jpg"
  ];

  var ARTISTS = {
    aiartman: {
      name: "Aiartman",
      collection: "Portraits",
      blurb: "Cinematic portraiture & surreal light"
    },
    celistima: {
      name: "Celistima",
      collection: "Ethereal",
      blurb: "Ethereal figures & soft fantasy worlds"
    },
    fantasy_ai_author: {
      name: "Fantasy AI",
      collection: "Mythic",
      blurb: "Mythic realms & character studies"
    },
    lofipromt: {
      name: "Lofipromt",
      collection: "Atmospheres",
      blurb: "Moody landscapes & quiet worlds"
    },
    maxvoao: {
      name: "Maxvoao",
      collection: "Figures",
      blurb: "Expressive figures & modern myth"
    }
  };

  var SIZES = [
    { id: "a3", label: "A3", dims: "29.7 × 42 cm", multiplier: 1, note: "Studio edition" },
    { id: "a2", label: "A2", dims: "42 × 59.4 cm", multiplier: 1.55, note: "Most collected" },
    { id: "a1", label: "A1", dims: "59.4 × 84.1 cm", multiplier: 2.35, note: "Statement scale" }
  ];

  var ADJECTIVES = [
    "Silent", "Molten", "Violet", "Hollow", "Gilded", "Midnight",
    "Feral", "Soft", "Electric", "Fading", "Crimson", "Lunar"
  ];

  var NOUNS = [
    "Reverie", "Bloom", "Orchard", "Leviathan", "Hymn", "Horizon",
    "Static", "Reliquary", "Tide", "Cathedral", "Mirage", "Ember"
  ];

  function artistKeyFor(file) {
    if (file.indexOf("fantasy_ai_author_") === 0) return "fantasy_ai_author";
    if (file.indexOf("celistima_") === 0) return "celistima";
    if (file.indexOf("lofipromt_") === 0) return "lofipromt";
    if (file.indexOf("maxvoao_") === 0) return "maxvoao";
    return "aiartman";
  }

  function titleFor(index) {
    var adjective = ADJECTIVES[index % ADJECTIVES.length];
    var noun = NOUNS[Math.floor(index / ADJECTIVES.length) % NOUNS.length];
    return adjective + " " + noun;
  }

  function roundPrice(value) {
    return Math.round(value / 100) * 100;
  }

  function pad(number) {
    return String(number).padStart(2, "0");
  }

  function priceForBase(base, size) {
    if (!size || size.id === "a3") return base;
    return roundPrice(base * size.multiplier);
  }

  var works = images.map(function (file, index) {
    var key = artistKeyFor(file);
    var artist = ARTISTS[key];
    var base = roundPrice(6200 + ((index * 397) % 8400));

    return {
      file: file,
      key: key,
      artist: artist.name,
      artistBlurb: artist.blurb,
      collection: artist.collection,
      title: titleFor(index),
      number: pad(index + 1),
      index: index,
      basePrice: base,
      editionSize: 25,
      description:
        "A " +
        artist.collection.toLowerCase() +
        " study from " +
        artist.name +
        "’s 2026 series. Reproduced as a limited edition on 310gsm cotton rag, hand-numbered and embossed with the studio seal."
    };
  });

  var countByArtist = works.reduce(function (counts, work) {
    counts[work.key] = (counts[work.key] || 0) + 1;
    return counts;
  }, {});

  function formatPrice(value) {
    return "₹" + Number(value).toLocaleString("en-IN");
  }

  function workByFile(file) {
    for (var i = 0; i < works.length; i++) {
      if (works[i].file === file) return works[i];
    }
    return null;
  }

  var lowestBase = works.reduce(function (lowest, work) {
    return work.basePrice < lowest ? work.basePrice : lowest;
  }, works[0].basePrice);

  window.PAINTRA = window.PAINTRA || {};
  window.PAINTRA.artists = ARTISTS;
  window.PAINTRA.works = works;
  window.PAINTRA.sizes = SIZES;
  window.PAINTRA.countByArtist = countByArtist;
  window.PAINTRA.formatPrice = formatPrice;
  window.PAINTRA.priceForBase = priceForBase;
  window.PAINTRA.workByFile = workByFile;
  window.PAINTRA.lowestBase = lowestBase;
})();
