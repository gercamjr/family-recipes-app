import { render, screen, fireEvent } from '@testing-library/react'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import i18n from '../../../i18n'
import configureStore from 'redux-mock-store'
import Header from '../Header'

const mockStore = configureStore([])

describe('Header Component', () => {
  it('renders the header with title', () => {
    const store = mockStore({ auth: { user: null } })
    render(
      <Provider store={store}>
        <I18nextProvider i18n={i18n}>
          <BrowserRouter>
            <Header />
          </BrowserRouter>
        </I18nextProvider>
      </Provider>
    )
    expect(screen.getByText(i18n.t('common.familyRecipes'))).toBeInTheDocument()
  })

  it('renders logout button when user is logged in', () => {
    const store = mockStore({ auth: { user: { id: 1 } } })
    render(
      <Provider store={store}>
        <I18nextProvider i18n={i18n}>
          <BrowserRouter>
            <Header />
          </BrowserRouter>
        </I18nextProvider>
      </Provider>
    )
    expect(screen.getByText(i18n.t('auth.logout'))).toBeInTheDocument()
  })

  it('dispatches logout action when logout button is clicked', () => {
    const store = mockStore({ auth: { user: { id: 1 } } })
    render(
      <Provider store={store}>
        <I18nextProvider i18n={i18n}>
          <BrowserRouter>
            <Header />
          </BrowserRouter>
        </I18nextProvider>
      </Provider>
    )
    fireEvent.click(screen.getByText(i18n.t('auth.logout')))
    const actions = store.getActions()
    expect(actions[0].type).toBe('auth/logout')
  })
})
