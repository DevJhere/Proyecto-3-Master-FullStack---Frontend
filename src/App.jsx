import './App.css'
import { AuthProvider } from './shared/context/AuthContext'
import { AppRouter } from './shared/routes/AppRouter'

function App() {

  return (
    
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
    
  )
}

export default App
