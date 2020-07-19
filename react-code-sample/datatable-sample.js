import React, { useEffect, useState } from 'react'
import WithHeaderFooter from '../../components/withHeaderFooter'
import axios from 'axios'
import DataTable from 'react-data-table-component';
import { Link } from 'react-router-dom'
import moment from 'moment'
import { stateFromHTML } from 'draft-js-import-html'
import ArticleContextActions from './ArticleContextActions'
import { paginationRowsPerPageOptions, paginationPerPage, defaultPage } from '../../helpers/common';
import "bootstrap";
import "../../../node_modules/bootstrap/dist/css/bootstrap.css";
import "../articles/articallist.css";
import { toast } from 'react-toastify';
import differenceBy from 'lodash/differenceBy'
import {Formik, Field, Form} from 'formik'
// const sortIcon = 

const BlogList = (props) => {
    const [blogs, setBlogs] = useState([])
    const [selectedRows, setSelectedRows] = useState([])
    const [toggleClear, setToggleClear] = useState(false)
    const [totalDocs, setTotalDocs] = useState(0)
    const [ pagination, setPagination ] = useState({ page: defaultPage, perPage: paginationPerPage })
    const columns = [
      { name: "Title", selector: "title", sortable: true},
      { name: "Description", selector: "description", cell: row=> <div>{ stateFromHTML(row.description).getPlainText().substring(0,30) }</div> },
      { name: "Author", selector: "author", cell: row=> <div>{ `${row.createdBy.firstName} ${row.createdBy.lastName}` }</div> },
      { name: "Created Date", selector: "createdAt", sortable: true, cell: row=> <div>{ moment(row.createdAt).format("DD-MM-YYYY") }</div> },
      { name: "Published Date", cell: row=> <div>{ (row.publishedAt) ? moment(row.publishedAt).format("DD-MM-YYYY"): "N/A" }</div> },
      { name: "status", cell: row=> <div>{ (row.isActive) ? <span className="label label-success">Active</span>: <span className="label label-danger">Inactive</span> }</div> },
      {
        name: "Actions", cell: row => <div style={{ display: 'flex', alignItems: 'center' }}>
          <Link to={`/article-detail/${row._id}`} type="button" className="btn waves-effect waves-light t-action-but"><i className="ti-pencil" data-toggle="tooltip" data-placement="top" title="Edit"></i></Link>
          <button type="button" className="btn waves-effect waves-light t-action-but"><i className="ti-archive" data-toggle="tooltip" data-placement="top" title="Archive"></i></button>
          <button type="button" className="btn waves-effect waves-light t-action-but"><i className="ti-face-smile" data-toggle="tooltip" data-placement="top" title="Approve"></i></button>
          <button type="button" className="btn waves-effect waves-light t-action-but"><i className="ti-face-sad" data-toggle="tooltip" data-placement="top" title="Dispapprove"></i></button>
          {/* <button type="button" className="btn waves-effect waves-light t-action-but"><i className="ti-alert" data-toggle="tooltip" data-placement="top" title="Tag for Moderation"></i></button> */}
          <button onClick={() => handleDeleteAll([row])}  type="button" className="btn waves-effect waves-light t-action-but"><i className="ti-trash" data-toggle="tooltip" data-placement="top" title="Delete"></i></button>
        </div>
      }
    ]
    useEffect(() => {
      const fetchBlogs = async() => {
        try {
          const { data } = await axios.get(`${process.env.API_URL}/admin/articles?limit=${paginationPerPage}`, { headers: { authorization: `bearer ${localStorage.getItem('token')}` } })
          setBlogs(data.data.docs)
          setTotalDocs(data.data.totalDocs)
        } catch (error) {
          console.log(error.response)
        }
      }
      fetchBlogs();
    }, []);

    const handleOnChangeRowsPerPage = async(payload) => {
      const url = `${process.env.ADMIN_API_URL}/articles?limit=${payload}`
      const { data } = await axios.get(url,{ headers: { authorization: `bearer ${localStorage.getItem('token')}` } })
     setBlogs(data.data.docs)
    }

    const handleOnChangePage = async(page) => {
        setPagination({page: page, perPage: paginationPerPage})
        const url = `${process.env.ADMIN_API_URL}/articles?page=${page}`
        const { data } = await axios.get(url,{ headers: { authorization: `bearer ${localStorage.getItem('token')}` } })
        setBlogs(data.data.docs)
    }

    const handleDeleteAll = async(rows) => {
      try {
        const ids = (rows.length) ? rows.map(item => item._id) : selectedRows.map(item => item._id)
        const {data} = await axios.post(`${process.env.ADMIN_API_URL}/articles/delete`, {ids},{ headers: { authorization: `bearer ${localStorage.getItem('token')}` } })
        if(data.success) {
          const diffs = (rows.length)  ? rows : selectedRows
          setBlogs(differenceBy(blogs, diffs,'_id'))
          toast.success("Articles Deleted!")
        }
      } catch (error) {
      }
    }

    const handleOnSortPage = async(column, sortDirection) => {
      const url = `${process.env.ADMIN_API_URL}/articles?page=${pagination.page}&sortKey=${column.selector}&sortDirection=${sortDirection}`
      const {data} = await axios.get(url, {headers: {authorization: `bearer ${localStorage.getItem('token')}`}})
      setBlogs(data.data.docs)
    }

    const handleSearch = async(values) => {
      // let searchValue = [...values.target.value]
      // console.log(searchValue)
      const url = `${process.env.ADMIN_API_URL}/articles?page=${pagination.page}&search=${values.search}`
      const {data} = await axios.get(url, {headers: {authorization: `bearer ${localStorage.getItem('token')}`}})
      setBlogs(data.data.docs)
    }

    return (
      <>
        <div className="row">
            <div className="col-12">
                <div className="card">
                    <div className="card-body">
                        <div className="row">
                            <div className="col-6">
                                <h4 className="card-title">Data Export</h4>
                                <h6 className="card-subtitle">Export data to Copy, CSV, Excel, PDF & Print</h6>
                            </div>
                            <div className="col-6 text-right">
                                <div className="button-group">
                                    <button type="button" className="btn waves-effect waves-light btn-primary">COPY</button>
                                    <button type="button" className="btn waves-effect waves-light btn-primary">CSV</button>
                                    <button type="button" className="btn waves-effect waves-light btn-primary">EXCEL</button>
                                    <button type="button" className="btn waves-effect waves-light btn-primary">PDF</button>
                                    <button type="button" className="btn waves-effect waves-light btn-primary">PRINT</button>
                                </div>
                            </div>
                        </div>
                        <div id="set-publish" className="modal fade in" tabIndex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">
                            <div className="modal-dialog">
                                <div className="modal-content">
                                    <div className="modal-header">
                                        <h4 className="modal-title" id="myModalLabel">Set Publishing Time</h4>
                                        <button type="button" className="close" data-dismiss="modal" aria-hidden="true">×</button>
                                    </div>
                                    <div className="modal-body">
                                        <form className="form-horizontal form-material">
                                            <div className="form-group">
                                                <div className="col-md-12 m-b-20">
                                                    <input type="text" className="form-control" placeholder="Date of Publishing" />
                                                </div>
                                                <div className="col-md-12 m-b-20">
                                                    <input type="text" className="form-control" placeholder="Time of Publishing" />
                                                </div>
                                            </div>
                                        </form>
                                    </div>
                                    <div className="modal-footer">
                                        <button type="button" className="btn btn-info waves-effect" data-dismiss="modal">Save</button>
                                        <button type="button" className="btn btn-default waves-effect" data-dismiss="modal">Cancel</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="table-responsive m-t-40">
                            <div className="button-group float-left">
                                <button type="button" className="btn waves-effect waves-light btn-success">Pubished</button>
                                <button type="button" className="btn waves-effect waves-light btn-danger">Disapproved</button>
                                <button type="button" className="btn waves-effect waves-light btn-info">Approved (not published)</button>
                                <button type="button" className="btn waves-effect waves-light btn-warning">Waiting</button>
                                <button type="button" className="btn waves-effect waves-light btn-primary">Archived</button>
                                <button type="button" className="btn waves-effect waves-light btn-dark">Tag for Moderations</button>
                            </div>
                            <Formik
                              initialValues={{search:""}}
                              onSubmit={handleSearch} 
                            >
                            {({values}) =>(
                              <Form>
                                <div className="dataTables_filter">
                                  <Field name="search" className="form-control form-control-sm" placeholder="Search"/>
                                </div>
                              </Form>
                            )}
                            </Formik>
                            <DataTable
                              pagination={true}
                              selectableRows
                              contextActions={<ArticleContextActions onClick={handleDeleteAll}  />}
                              onSelectedRowsChange={(state) => {
                                setSelectedRows(state.selectedRows)
                                setToggleClear(false)
                              }}
                              clearSelectedRows={toggleClear}
                              columns={columns}
                              data={blogs}
                              paginationServer={true}
                              paginationTotalRows={totalDocs}
                              paginationPerPage={paginationPerPage}
                              paginationRowsPerPageOptions={paginationRowsPerPageOptions}
                              onChangePage={handleOnChangePage}
                              onChangeRowsPerPage={handleOnChangeRowsPerPage}
                              defaultSortField={"title"}
                              defaultSortAsc={true}
                              onSort={handleOnSortPage}
                              className="table table-hover table-striped table-bordered"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </>
    )
}

export default WithHeaderFooter(BlogList, { title: "Articals" })