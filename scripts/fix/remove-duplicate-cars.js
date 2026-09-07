/**
 * scripts/fix/remove-duplicate-cars.js
 * Ìﬂ‘› ÊÌÕ–› «·”Ì«—«  «·„ﬂ——… - ÌÕ ›Ÿ »√ÕœÀ ‰”Œ…
 * «·«” Œœ«„:
 *   node scripts/fix/remove-duplicate-cars.js          (dry-run)
 *   node scripts/fix/remove-duplicate-cars.js --delete  (Õ–› ›⁄·Ì)
 */
require("dotenv").config();
const mongoose = require("mongoose");
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;
const DRY_RUN = !process.argv.includes("--delete");

if (!MONGO_URI || !MONGO_URI.startsWith("mongodb")) {
  console.error("? MONGO_URI €Ì— ’«·Õ. √÷›Â ›Ì .env");
  process.exit(1);
}

async function main() {
  await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 20000 });
  console.log("? „ ’· »‹ Atlas\n");
  const col = mongoose.connection.db.collection("cars");
  const totalBefore = await col.countDocuments();
  console.log(`?? «·”Ì«—«  ﬁ»·: ${totalBefore}`);

  const duplicates = await col.aggregate([
    { $group: {
        _id: { title:"$title", make:"$make", model:"$model", year:"$year" },
        count: { $sum: 1 }, ids: { $push: "$_id" }, dates: { $push: "$createdAt" }
    }},
    { $match: { count: { $gt: 1 } } },
    { $sort: { count: -1 } }
  ]).toArray();

  console.log(`?? „Ã„Ê⁄«  „ﬂ——…: ${duplicates.length}`);
  const idsToDelete = [];

  for (const g of duplicates) {
    let newestIdx = 0, newestDate = new Date(g.dates[0] || 0);
    for (let i = 1; i < g.ids.length; i++) {
      const d = new Date(g.dates[i] || 0);
      if (d > newestDate) { newestDate = d; newestIdx = i; }
    }
    const toDelete = g.ids.filter((_, i) => i !== newestIdx);
    idsToDelete.push(...toDelete);
    console.log(`  [${g.count}x] ${g._id.make||"?"} ${g._id.model||"?"} ${g._id.year||"?"} ó "${(g._id.title||"").substring(0,50)}" ? Õ–› ${toDelete.length}`);
  }

  console.log(`\n?? ≈Ã„«·Ì ··Õ–›: ${idsToDelete.length}`);

  if (DRY_RUN) {
    console.log("??  DRY RUN ó ·„ ÌıÕ–› ‘Ì¡. √÷› --delete ··Õ–› «·›⁄·Ì");
  } else {
    const result = await col.deleteMany({ _id: { $in: idsToDelete } });
    console.log(`?  „ Õ–› ${result.deletedCount} ”Ì«—… „ﬂ——…`);
    const totalAfter = await col.countDocuments();
    console.log(`?? «·”Ì«—«  »⁄œ: ${totalAfter} ( „  Õ—Ì— ${totalBefore - totalAfter})`);

    // ≈÷«›… unique index ⁄·Ï externalId
    try {
      await col.createIndex({ externalId: 1 }, { unique: true, sparse: true, name: "externalId_unique_sparse" });
      console.log("?  „ ≈‰‘«¡ unique sparse index ⁄·Ï externalId");
    } catch (e) { console.warn("??  Index:", e.message); }
  }

  await mongoose.disconnect();
}

main().catch(e => { console.error("?", e.message); mongoose.disconnect(); process.exit(1); });
