import {motion} from "framer-motion"
import Input from "../../components/Input"
import { Lock, ChefHat } from "lucide-react"
import { useState } from "react"
import toast, { Toaster } from "react-hot-toast"

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const isLoading = false
  
  const handleLogin = (e) => {
    e.preventDefault()

    if (newPassword !== confirmNewPassword) {
      toast.error("As senhas não coincidem ❌");
      return;
    }

    toast.success("Senha alterada com sucesso ✅");
  }

  return (
    <>
      <div className='min-h-screen bg-gradient-to-br from-gray-900 via-green-600 to-emerald-600 flex items-center justify-center relative overflow-hidden'>
        <motion.div
        initial={{opacity: 0, y:20}}
          animate={{opacity: 1, y: 0}}
          transition={{duration: 0.5}}
          className='md:max-w-md w-full bg-gray-800 bg-opacity-50 backdrop-filter backdrop-blur-xl rounded-2xl shadow-xl overflow-hidden lg:max-w-lg'
        >
          <div className="p-8">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full">
                <ChefHat className="w-8 h-8 text-white" />
              </div>
            </div>
            <h2 className='text-3xl font-bold mb-6 text-center bg-gradient-to-r from-green-400 to-emerald-500 text-transparent bg-clip-text font-mono'>
              Redefinir Senha
            </h2>
            <form onSubmit={handleLogin}>
              <Input
                    icon={Lock}
                    type='password'
                    placeholder='Nova senha'
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                />

                <Input
                    icon={Lock}
                    type='password'
                    placeholder='Confirmar senha'
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                />

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className='w-full py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium rounded-lg shadow-lg hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition duration-200 font-mono text-lg font'
                  type='submit'
                  disabled={isLoading}	
					      >
                  Login
					      </motion.button>
            </form>
          </div>
        </motion.div>
        <Toaster position="top-center" reverseOrder={false}/>
      </div>
    </>
  )
}

export default ResetPassword