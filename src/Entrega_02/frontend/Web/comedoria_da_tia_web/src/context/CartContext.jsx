import { createContext, useContext, useReducer } from 'react'

const CartContext = createContext()

// Estado inicial
const initialState = {
  items: [],
  total: 0,
  itemCount: 0
}

// Reducer para gerenciar estado
function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD_ITEM':
      const existingItem = state.items.find(item => item.id === action.payload.id)
      
      if (existingItem) {
        // Se item já existe, aumenta quantidade
        const updatedItems = state.items.map(item =>
          item.id === action.payload.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
        
        return {
          ...state,
          items: updatedItems,
          total: state.total + action.payload.price,
          itemCount: state.itemCount + 1
        }
      } else {
        // Se é novo item, adiciona
        const newItem = { ...action.payload, quantity: 1 }
        
        return {
          ...state,
          items: [...state.items, newItem],
          total: state.total + action.payload.price,
          itemCount: state.itemCount + 1
        }
      }

    case 'REMOVE_ITEM':
      const itemToRemove = state.items.find(item => item.id === action.payload)
      const filteredItems = state.items.filter(item => item.id !== action.payload)
      
      return {
        ...state,
        items: filteredItems,
        total: state.total - (itemToRemove.price * itemToRemove.quantity),
        itemCount: state.itemCount - itemToRemove.quantity
      }

    case 'UPDATE_QUANTITY':
      const updatedItems = state.items.map(item => {
        if (item.id === action.payload.id) {
          const quantityDiff = action.payload.quantity - item.quantity
          return { ...item, quantity: action.payload.quantity }
        }
        return item
      })
      
      const item = state.items.find(item => item.id === action.payload.id)
      const totalDiff = (action.payload.quantity - item.quantity) * item.price
      
      return {
        ...state,
        items: updatedItems,
        total: state.total + totalDiff,
        itemCount: state.itemCount + (action.payload.quantity - item.quantity)
      }

    case 'CLEAR_CART':
      return initialState

    default:
      return state
  }
}

// Provider do contexto
export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, initialState)

  const addToCart = (product) => {
    dispatch({ type: 'ADD_ITEM', payload: product })
  }

  const removeFromCart = (productId) => {
    dispatch({ type: 'REMOVE_ITEM', payload: productId })
  }

  const updateQuantity = (productId, quantity) => {
    if (quantity < 1) {
      removeFromCart(productId)
      return
    }
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id: productId, quantity } })
  }

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' })
  }

  const value = {
    items: state.items,
    total: state.total,
    itemCount: state.itemCount,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart
  }

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}

// Hook personalizado
export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}