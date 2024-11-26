const Fuse = require('fuse.js');
const wordnet = require('wordnet');
const Backend = require('../models/backendModel');

const comprehensiveMatchController = async (allDocuments, contentValues) => {
    try {
        console.log("It's comprehensiveMatchController");

        const fuseOptions = {
            includeScore: true,
            shouldSort: true,
            threshold: 0.4, 
        };

        const fuse = new Fuse(contentValues, fuseOptions);

        for (const document of allDocuments) {
            const { content, _id, relation = [] } = document;

            if (!isNaturalLanguageWord(content)) continue;

            const fuzzyMatches = fuse.search(content).map(result => result.item);

            let synonymMatches = [];
            const synonyms = await getSynonyms(content);
            synonymMatches = contentValues.filter(candidate => 
                synonyms.includes(candidate.toLowerCase())
            );

            const comprehensiveMatches = [...new Set([...fuzzyMatches, ...synonymMatches])];

            console.log(`Matches for "${content}":`, comprehensiveMatches);

            const relatedIds = await Backend.find({ content: { $in: comprehensiveMatches } }, '_id');
            let newRelatedTo = relatedIds
                .map(doc => doc._id.toString()) // Convert ObjectId to string
                .filter(id => id !== _id.toString()); // Compare as strings

            if (newRelatedTo.length > 0) {
                // Check if the document already has a "comprehensive match" relation
                let updated = false;
                for (let rel of relation) {
                    if (rel.relationType === "comprehensive match") {
                        // Add only new and non-duplicate IDs to the relatedTo array
                        newRelatedTo = newRelatedTo.filter(id => 
                            !rel.relatedTo.map(id => id.toString()).includes(id)
                        );
                        if (newRelatedTo.length > 0) {
                            rel.relatedTo = Array.from(new Set([...rel.relatedTo.map(id => id.toString()), ...newRelatedTo]));
                        }
                        updated = true;
                        break;
                    }
                }

                if (!updated && newRelatedTo.length > 0) {
                    // If no existing comprehensive match relation, add a new one
                    relation.push({
                        relationType: "comprehensive match",
                        relatedTo: newRelatedTo,
                    });
                }

                // Update the current document with the modified relation array
                await Backend.findByIdAndUpdate(_id, {
                    relation: relation
                });

                // Update the matched documents to include the current document's _id
                for (let relatedId of newRelatedTo) {
                    const matchedDoc = await Backend.findById(relatedId);

                    let matchedRelation = matchedDoc.relation || [];
                    let updatedMatched = false;

                    for (let rel of matchedRelation) {
                        if (rel.relationType === "comprehensive match") {
                            if (!rel.relatedTo.map(id => id.toString()).includes(_id.toString())) {
                                rel.relatedTo = Array.from(new Set([...rel.relatedTo.map(id => id.toString()), _id.toString()]));
                            }
                            updatedMatched = true;
                            break;
                        }
                    }

                    if (!updatedMatched) {
                        matchedRelation.push({
                            relationType: "comprehensive match",
                            relatedTo: [_id.toString()],
                        });
                    }

                    await Backend.findByIdAndUpdate(relatedId, {
                        relation: matchedRelation
                    });
                }
            }
        }
    } catch (error) {
        console.error("Error in comprehensiveMatchController:", error);
    }
};

const getSynonyms = (word) => {
    return new Promise((resolve) => {
        wordnet.lookup(word, (err, definitions) => {
            if (err || !definitions || definitions.length === 0) {
                resolve([]); 
            } else {
                const synonyms = definitions.flatMap(def => def.synonyms).map(syn => syn.toLowerCase());
                resolve(synonyms);
            }
        }).catch(() => {
            resolve([]); 
        });
    });
};

const isNaturalLanguageWord = (word) => {
    return /^[a-zA-Z]+$/.test(word);
};

module.exports = { comprehensiveMatchController };
