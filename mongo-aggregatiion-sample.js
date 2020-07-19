const PrimaryCategory = require('../../../models/primaryCategory')

class primaryCategoryController {
    async index(req, res) {
        try {
            const primaryCategories = await PrimaryCategory.find({isActive: true})
            return res.status(200).json({success: true, data: primaryCategories})
        } catch (error) {
            return res.status(500).json({error: true, message: error.message})
        }
    }

    async show(req, res) {
        try {
            const primaryCategory = await PrimaryCategory.findOne({_id: req.params.id, isActive: true})
            return res.status(200).json({success: true, data: primaryCategory})
        } catch (error) {
            return res.status(500).json({error: true, message: error.message})
        }
    }

    async aggregatedMenu(req, res) {
        try {
            const data = await PrimaryCategory.aggregate([
                {$lookup: {from: "categories", localField: "_id", foreignField: "primaryCategory", as: "cat"}},
                { $unwind: { path: "$cat", preserveNullAndEmptyArrays: true } },
                {
                    $lookup: {
                        from: "subcategories",
                        "let": { "categoryId": "$cat._id" },
                        "pipeline": [
                            { "$match": { "$expr": { "$eq": ["$category", "$$categoryId"] } } },
                            { "$project": { "name": 1, "_id": 1 } }
                        ],

                        "as": "subCategories"
                    }
                },
                {
                    $group: {
                        _id: "$_id",
                        name: { $first: "$name" },
                        categories: { "$addToSet": { category_name: "$cat.name", _id: "$cat._id", subCategories: "$subCategories" } },
                    }
                },
                {
                    $project: {
                        name: "$name",
                        categories: {
                            $filter: { input: "$categories", as: "category", cond: { $ifNull: ["$$category._id", false] } }
                        }
                    }
                },
                {
                    $sort: {
                        name: 1
                    }
                }
            ])
            return res.status(200).json({success: true, data: data})
        } catch (error) {
            return res.status(500).json({error: true, message: error})
        }
    }
}

module.exports = new primaryCategoryController()