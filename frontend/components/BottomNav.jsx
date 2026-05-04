import React from 'react';
import { AppScreen } from '../types';

export const BottomNav = ({ currentScreen, onNavigate, onPlaceAd }) => {
  const NavItem = ({ screen, icon, label, isPrimaryIcon = false }) => {
    const isActive = currentScreen === screen;
    return (
      <button
        onClick={() => onNavigate(screen)}
        className={`flex flex-col items-center gap-1 transition-colors ${isActive ? 'text-primary' : 'text-gray-400'}`}
      >
        <span className={`material-icons-outlined text-2xl ${isPrimaryIcon && isActive ? 'text-primary' : (isPrimaryIcon ? 'text-gray-400' : '')}`}>
          {icon}
        </span>
        <span className="text-[10px] font-medium">{label}</span>
      </button>
    );
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 mx-auto w-full max-w-md bg-white border-t border-gray-100 flex justify-around items-center px-2 pt-3 pb-8 z-40 safe-bottom">
      <NavItem screen={AppScreen.HOME} icon="home" label="Home" />
      <NavItem screen={AppScreen.FAVORITES} icon="favorite_border" label="Favorites" />

      <div className="relative -mt-10">
        <button
          onClick={onPlaceAd}
          className="w-14 h-14 bg-primary rounded-full shadow-lg shadow-red-200 flex items-center justify-center text-white active:scale-90 transition-transform"
        >
          <span className="material-icons-round text-3xl">add</span>
        </button>
        <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-medium text-gray-400 whitespace-nowrap">Place ad</span>
      </div>

      <NavItem screen={AppScreen.PROFILE} icon="person_outline" label="Profile" />
      <NavItem screen={AppScreen.MENU} icon="local_fire_department" label="Menu" isPrimaryIcon={true} />
    </nav>
  );
};
