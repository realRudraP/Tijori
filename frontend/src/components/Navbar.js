import React from 'react';

const Navbar = ({ isDarkTheme, toggleTheme }) => {
  return (
    <nav className="navbar navbar-expand-lg bg-body-tertiary" style={{zIndex:2}}>
      <div className="container-fluid">
        <a className="navbar-brand" href='/'>Tijori</a>
        <i
          className={`bi ${isDarkTheme ? 'bi-sun' : 'bi-moon'} fs-4`}
          onClick={toggleTheme}
          style={{ cursor: 'pointer' }}
        />
      </div>
    </nav>
  );
};

export default Navbar;
