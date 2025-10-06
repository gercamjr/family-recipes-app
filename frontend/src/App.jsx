import RecipeList from './components/recipes/RecipeList'
import Header from './components/ui/Header'
import Footer from './components/ui/Footer'

function App() {
  return (
    <div className='flex flex-col min-h-screen'>
      <Header />
      <main className='flex-grow container mx-auto p-4'>
        <RecipeList />
      </main>
      <Footer />
    </div>
  )
}

export default App
