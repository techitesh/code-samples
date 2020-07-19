import React from 'react'
import Header from './Header'
import Footer from './Footer'
import BreadCrumb from './BreadCrumb'

const withHeaderFooter = (WrappedComponent, extraProps={}) => {
    return function(props)  {
        return (
            <>
            <Header />
                <div className="page-wrapper">
                    <div className="container-fluid">
                        <BreadCrumb {...extraProps} />
                        <div className="row">
                            <div className="col-12">
                                <WrappedComponent {...props} />
                            </div>
                        </div>
                    </div>
                </div>
            <Footer />
            </>
        )
    }
}

export default withHeaderFooter