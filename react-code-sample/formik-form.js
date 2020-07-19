import React, { useState, useEffect }  from 'react'
import axios from 'axios'
import WithHeaderFooter from '../../components/withHeaderFooter'
import { Formik, Field, FieldArray, Form } from 'formik'
import Editor, { createEditorStateWithText } from 'draft-js-plugins-editor';
import createToolbarPlugin, { Separator } from 'draft-js-static-toolbar-plugin';
import 'draft-js-static-toolbar-plugin/lib/plugin.css';
import '../articles/editor.css'
import { TagPicker, DatePicker } from 'rsuite'

const staticToolbarPlugin = createToolbarPlugin();
const { Toolbar } = staticToolbarPlugin;
const plugins = [staticToolbarPlugin];

import {
	ItalicButton, BoldButton, UnderlineButton, CodeButton,
	UnorderedListButton, OrderedListButton,BlockquoteButton,
	CodeBlockButton,
  } from 'draft-js-buttons';
import draftToHtml from 'draftjs-to-html';
import { convertToRaw } from 'draft-js';
import { toast } from 'react-toastify';
import ImageUploader from '../../components/ImagUploader';

const AddProduct = () => {
    const [primaryCategories, setPrimaryCategories]= useState([])
    const [categories, setCategories] = useState([])
    const [subCategories, setSubCategories] = useState([])
    const [selectedPricingTemplate, setSelectedPricingTemplate] = useState({})
    const [pricingTemplate, setPricingTemplate] = useState([])
    const [brands, setBrands] = useState([])
    const [collections, setCollections] = useState([])
    const [productCatalogues, setProductCatalogues] = useState([])
    const [keywords, setKeywords] = useState([])
    const [productLogo, setProductLogo] = useState([])
    let intialValues = {
        title: "", sku: "", tagLine: "", brand: "", collectionId: "", designedBy: "", description: createEditorStateWithText(""),
        launchDate: new Date(), dimention: "", videoLinks: "", productCatalogue: "", seoTitle: "", seoMetaDescription: "",
        seoPermalink:"", keywords: "", primaryCategory: "", category: "", subCategory: "", pricingTemplate: "", priceType: "basic",
        basicPrice: 0, advancedPrice: [], tags: [], availableAt: "", filterValues: ""
    }
    
    useEffect(() => {
        const fetchData = async() => {
            const baseUrl = `${process.env.ADMIN_API_URL}`
            const authHeaders = { headers: { authorization: `bearer ${localStorage.getItem('token')}` } }
            const primaryCategoriesPromise =  axios.get(`${baseUrl}/primary-categories`,authHeaders)
            const categoriesPromise =  axios.get(`${baseUrl}/categories`, authHeaders)
            const subCategoriesPromise = axios.get(`${baseUrl}/sub-categories`, authHeaders)
            const brandPromise = axios.get(`${baseUrl}/brand`, authHeaders)
            const collectionPromise = axios.get(`${baseUrl}/collection`, authHeaders)
            const cataloguePromise = axios.get(`${baseUrl}/product-catalogue`, authHeaders)
            const [
                primaryCategoriesResult, categoriesResult, subCategoriesResult, brandResult, collectionResult, catalogueResult
            ] = await Promise.all([
                primaryCategoriesPromise, categoriesPromise, subCategoriesPromise, brandPromise, collectionPromise, cataloguePromise
            ])
            setPrimaryCategories(primaryCategoriesResult.data.data)
            setCategories(categoriesResult.data.data)
            setSubCategories(subCategoriesResult.data.data)
            setBrands(brandResult.data.data)
            setCollections(collectionResult.data.data)
            setProductCatalogues(catalogueResult.data.data)
        }
        fetchData();
    },[])

    const handleSubmit = async(values, {resetForm, setSubmitting}) => {
        try {
            setSubmitting(true)
            const formData = new FormData()
            for (const [key, value] of Object.entries(values)) {
                if(key == 'description') {
                    formData.set("description", draftToHtml(convertToRaw(value.getCurrentContent())))
                }else{
                    formData.set("productFiles", productLogo.file)
                    formData.set(key, value)
                }
            }
            const { data }  = await axios.post(`${process.env.ADMIN_API_URL}/products/create`, formData, { headers: { authorization: `bearer ${localStorage.getItem('token')}` } })
            if(data.success) {
                toast.success("Product Added!")
                setProductLogo("")
                resetForm()
			}
        } catch (error) {
            console.log(error)
            setSubmitting(false)
			toast.error("Something Went Wrong")
        }
    }

    const renderButtons = (externalProps) => {
		return (
			<div>
				<BoldButton {...externalProps} />
				<ItalicButton {...externalProps} />
				<UnderlineButton {...externalProps} />
				<CodeButton {...externalProps} />
				<Separator {...externalProps} />
				<UnorderedListButton {...externalProps} />
				<OrderedListButton {...externalProps} />
				<BlockquoteButton {...externalProps} />
				<CodeBlockButton {...externalProps} />
			</div>
		)
    }

    const getPricingTemplate = async (subCategory) => {
        let url = `${process.env.ADMIN_API_URL}/pricing-template/${subCategory}/list`
        const {data} = await axios.get(url, { headers: { authorization: `bearer ${localStorage.getItem('token')}`}})
        setPricingTemplate(data.data)
    }

    return (
        <div className="row">
			<div className="col-sm-12">
                <div className="card card-body">
					<h4 className="card-title">Add Product</h4>
                    <Formik enableReinitialize={false}
                    initialValues={intialValues}
                    onSubmit={handleSubmit}
                    >
                        {({values, isSubmitting, setFieldValue}) => (
                            <Form>
                                <div className="form-group">
                                    <label htmlFor="title">Product Name</label>
                                    <Field name="title" className="form-control" placeholder="Product Name Here..." />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="sku">SKU</label>
                                    <Field name="sku" className="form-control" placeholder="SKU Here..." />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="tagline">Tag Line</label>
                                    <Field name="tagLine" className="form-control" placeholder="Tag Line Here..." />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="brand">Brand</label>
                                    <Field as="select" name="brand" className="form-control">
                                        <option value="">Please Select Brand</option>
                                        { brands.map((item, index) => <option key={index} value={item._id}>{item.name}</option>) }
                                    </Field>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="collection">Collection</label>
                                    <Field as="select" name="collectionId" className="form-control">
                                        <option value="">Please Select Collection</option>
                                        { collections.map((item, index) => <option key={index} value={item._id}>{item.name}</option>) }
                                    </Field>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="designedby">Designed By</label>
                                    <Field as="select" name="designedBy" className="form-control">
                                        <option value="">Please Select</option>
                                        <option value="architect">Architect</option>
                                        <option value="interior-designer">Interior Designer</option>
                                        <option value="product-designer">Product Designer</option>
                                    </Field>
                                </div>

                                <div className="form-group editor">
                                    <Editor
                                    editorState={values.description}
                                    onChange={(editorState) => setFieldValue("description", editorState)}
                                    plugins={plugins}
                                    />
                                    <Toolbar children={renderButtons} />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="launchDate">Launch Date</label>
                                    <DatePicker oneTap style={{width: '100%'}} onChange={(date) => setFieldValue("launchDate", date)}/>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="dimention">Dimention</label>
                                    <Field name="dimention" className="form-control" placeholder="Dimention Here..." />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="images">Upload Images</label>
                                    <ImageUploader multiple={true} onSubmit={({meta, file, remove},status) => {
											(status == "done") ? setProductLogo({ file, remove }) : setProductLogo("")}}
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="videos">Upload Videos</label>
                                    <Field name="videoLinks" className="form-control" placeholder="Videos Link Here..."/>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="catalogus">Product Catalogues</label>
                                    <Field as="select" name="productCatalogue" className="form-control">
                                        <option value="">Please Select Product Catalogue</option>
                                        { productCatalogues.map((item, index) => <option key={index} value={item._id}>{item.name}</option>) }
                                        
                                    </Field>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="seotitle">SEO Title</label>
                                    <Field name="seoTitle" className="form-control" placeholder="SEO Title Here..." />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="seometa-description">SEO Meta Description</label>
                                    <Field name="seoMetaDescription" className="form-control" placeholder="SEO Meta Description Here..." />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="permalink">SEO Permalink</label>
                                    <Field name="seoPermalink" className="form-control" placeholder="SEO Permalink Here..." />
                                </div>
                                
                                <div className="form-group">
                                    <label htmlFor="keywords">Keywords</label>
                                    <TagPicker
                                     onChange={(data)=>setFieldValue("keywords", data)}
                                     className="form-control"
                                     creatable={true}
                                     labelKey="keywords"
                                     valueKey="keywords"
                                     value={values.keywords}
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="Primary-category">Primary Category</label>
                                    <Field as="select" id="primaryCategory" name="primaryCategory" className="form-control">
                                        <option value="">Please Select</option>
                                        { primaryCategories.map((item, index) => <option key={index} value={item._id}>{item.name}</option>) }
                                    </Field>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="category">Category</label>
                                    <Field as="select" id="category" name="category" className="form-control">
                                        <option value="">Please Select</option>
                                        { categories.map((item, index) => <option key={index} value={item._id}>{item.name}</option>) }
                                    </Field>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="sub-category">Sub Category</label>
                                    <Field component="select" id="subCategory" className="form-control" value={values.subCategory} onChange={(e) => {
                                        setFieldValue("subCategory", e.target.value)
                                        getPricingTemplate(e.target.value)
                                    }}>
                                        <option value="">Please Select</option>
                                        { subCategories.map((item, index) => <option key={index} value={item._id}>{item.name}</option>) }
                                    </Field>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="pricing-template">Pricing Template</label>
                                    <Field component="select" name={'pricingTemplate'} className="form-control" onChange={(e) => {
                                        setFieldValue("pricingTemplate", e.target.value)
                                        setSelectedPricingTemplate(pricingTemplate.find(item => item._id == e.target.value))
                                    }}>
                                        <option value="">Please Select</option>
                                            { pricingTemplate.map((item, index) => <option key={index} value={item._id}>{item.name}</option>)}
                                    </Field>
                                </div>

                                <div className="form-group">
                                    <label style={{paddingRight: "15px"}}>
                                        <input type="radio" name="priceType" value="basic"
                                        checked={values.priceType === "basic"}
                                        onChange={() => setFieldValue("priceType", "basic")}
                                        /> Basic Price
                                    </label>
                                    <label>
                                        <input type="radio" name="priceType" value="advanced"
                                        checked={values.priceType === "advanced"}
                                        onChange={() => setFieldValue("priceType", "advanced")}
                                        /> Advanced Price
                                    </label>
                                </div>

                                <div className="form-group">
                                    {(values.priceType == "basic") ? 
                                    <Field name="basicPrice" className="form-control" placeholder="Basic Price" /> :
                                    <FieldArray
                                        name="advancedPrice"
                                        render={arrayHelpers => (
                                            <div>
                                                {values.advancedPrice && values.advancedPrice.length > 0 ? (
                                                    values.advancedPrice.map((item, idx) => (
                                                        <div key={idx}>
                                                            {selectedPricingTemplate.filters.map((category, index) => (
                                                                <div className="form-group"  key={index}>
                                                                    <div className="col-md-2" style={{float: "left"}}>
                                                                        <label htmlFor="label">{category.label}</label>
                                                                        <Field as="select" name={`advancedPrice.${idx}.${category.label}`} className="form-control">
                                                                            <option value="">--</option>
                                                                            {category.options.map((item, index) => <option key={index} value={item.label}>{item.label}</option>)}
                                                                        </Field>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                            {selectedPricingTemplate.columnLabels.map((item, index) => (
                                                                <div className="col-md-2" style={{float: "left"}} key={index}>
                                                                    <label htmlFor="advance-price">{item}</label>
                                                                    <Field name={`advancedPrice.${idx}.${item}`} className="form-control" />
                                                                </div>
                                                            ))}
                                                            <div className="col-md-1" style={{float: "left"}}>
                                                                <button className="btn btn-danger mr-1" style={{marginTop: "25px", fontWeight: "bold"}} type="button" onClick={() => arrayHelpers.remove(idx)}>x</button>
                                                                <button className="btn btn-secondary" style={{marginTop: "25px", fontWeight: "bold"}} type="button" onClick={() => arrayHelpers.push([...selectedPricingTemplate.filters.map(item => item.label),...selectedPricingTemplate.columnLabels].reduce((a,b) => { return { ...a,[b]: "" } },{}))}>+</button>
                                                            </div>
                                                            <div className="clearfix"></div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="col-md-9 text-center">
                                                        {/*<button className="btn btn-secondary" style={{marginTop: "15px", fontWeight: "bold"}} type="button" onClick={() => arrayHelpers.push(...[...selectedPricingTemplate.filters.map(item => item.label),...selectedPricingTemplate.columnLabels].map(label => {return {[label]: ""}}))}>ADD</button>*/}
                                                        <button className="btn btn-secondary" style={{marginTop: "15px", fontWeight: "bold"}} type="button" onClick={() => arrayHelpers.push([...selectedPricingTemplate.filters.map(item => item.label),...selectedPricingTemplate.columnLabels].reduce((a,b) => { return { ...a,[b]: "" } },{}))}>ADD</button>
                                                    </div>
                                                )}
                                            </div>
                                        )} 
                                    />
                                    }
                                </div>
                                <div className="clearfix"></div>
                                <div className="form-group pt-1">
                                    <label htmlFor="tags">Tags</label>
                                    <TagPicker
                                     onChange={(data)=>setFieldValue("tags", data)}
                                     className="form-control"
                                     creatable={true}
                                     labelKey="tags"
                                     valueKey="tags"
                                     value={values.tags}
                                    />
                                </div>

                                

                                {/* <div className="form-group">
                                    { (Object.keys(selectedSubCategory).length)
                                        ? renderFilter()
                                        : null
                                    }
                                </div> */}
                                <div className="text-center">
                                    <button disabled={isSubmitting} className="btn btn-success">Save</button>
                                </div>
                            </Form>
                        )}
                    </Formik>
                </div>
            </div>
        </div>
    )
}

export default WithHeaderFooter(AddProduct)
