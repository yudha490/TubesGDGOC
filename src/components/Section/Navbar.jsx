import * as React from 'react';

const Navbar = () => {
  return (
    <nav className='mx-auto flex h-[114px] w-[1170px] items-center'>
      <ul className='font-display justify-start'>
        <a href='/'>
          <li className='flex flex-row gap-1'>
            <h1 className='text-h3 text-primary-black font-bold'>Trabook</h1>
            <img src='/assets/logo.svg' alt='logo' />
          </li>
        </a>
      </ul>
    </nav>
  );
};

export default Navbar;
