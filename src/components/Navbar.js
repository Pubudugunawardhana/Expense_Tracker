import { NavLink } from 'react-router-dom';

const NAV_ITEMS = [
  { label: 'Home', to: '/', end: true },
  { label: 'Add Expense', to: '/add', end: false },
  { label: 'Budgets', to: '/budgets', end: false },
  { label: 'Summary', to: '/summary', end: false },
];

function Navbar({ onNavigate }) {
  return (
    <nav aria-label="Primary" className="app-navbar">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          className={({ isActive }) =>
            isActive ? 'nav-link nav-link-active' : 'nav-link'
          }
          end={item.end}
          onClick={onNavigate}
          to={item.to}
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}

export default Navbar;
