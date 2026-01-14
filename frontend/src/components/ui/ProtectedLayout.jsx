import React from 'react'
import Header from './Header'
import Footer from './Footer'

const ProtectedLayout = ({ children }) => {
  return (
    <div className='flex flex-col min-h-screen'>
      <Header />
      <main className='flex-grow container mx-auto p-4'>{children}</main>
      <Footer />
    </div>
  )
}

export default ProtectedLayout
