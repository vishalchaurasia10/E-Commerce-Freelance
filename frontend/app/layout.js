import Announcement from './components/layout/Announcement'
import Footer from './components/layout/Footer'
import Navbar from './components/layout/Navbar'
import AuthState from './context/Auth/AuthState'
import FeaturedState from './context/FeaturedProducts/FeaturedState'
import ProductState from './context/Products/ProductState'
import './globals.css'
import { roboto } from './utils/fonts'

export const metadata = {
  title: 'Home | E-Commerce',
  description: 'Generated by create next app',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${roboto.className}`}>
        <AuthState>
          <ProductState>
            <FeaturedState>
              <Announcement />
              <Navbar />
              {children}
              <Footer />
            </FeaturedState>
          </ProductState>
        </AuthState>
      </body>
    </html>
  )
}
