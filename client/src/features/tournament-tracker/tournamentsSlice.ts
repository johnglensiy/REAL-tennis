import { createSlice } from '@reduxjs/toolkit'
import type { TournamentState } from './types';

// initial state contains stub data for now
const initialState: TournamentState[] = [
  {
    name: 'Wimbledon',
    tour: 'men',
    detail: "Gentlemen's Singles · R16 · Grass",
    matches: [
      { id: 'main', status: 'live', meta: 'Set 4 · 2:14', live: 'LIVE', href: 'Tennis Scoreboard.html',
        a: { name: 'A. Sinclair', country: 'GBR', seed: '4',  sets: [6,3,7,2], pts: '30', serving: true },
        b: { name: 'M. Okonkwo',  country: 'NGR', seed: '11', sets: [4,6,6,1], pts: '15' } },
      { id: 'm2', status: 'live', meta: 'Set 2 · 0:51', live: 'LIVE',
        a: { name: 'L. Vasquez',  country: 'ESP', seed: '2',  sets: [6,3], pts: '40', serving: true },
        b: { name: 'F. Lindqvist', country: 'SWE', seed: '15', sets: [4,2], pts: '15' } },
      { id: 'm3', status: 'final', meta: 'Final · 2:38',
        a: { name: 'T. Haas',     country: 'GER', seed: '7',  sets: [7,6,6], winner: true },
        b: { name: 'D. Petrov',   country: 'BUL', seed: '9',  sets: [5,7,3] } },
      { id: 'm4', status: 'final', meta: 'Final · 1:54',
        a: { name: 'K. Nakamura', country: 'JPN', seed: '5',  sets: [6,6], winner: true },
        b: { name: 'É. Dubois',   country: 'FRA', seed: '12', sets: [3,4] } },
      { id: 'm5', status: 'upcoming', meta: 'Today · 16:00',
        a: { name: 'R. Costa',    country: 'POR', seed: '8' },
        b: { name: 'S. Ali',      country: 'PAK', seed: '—' } },
    ],
  },
  {
    name: 'Wimbledon',
    tour: 'women',
    detail: "Ladies' Singles · R16 · Grass",
    matches: [
      { id: 'w1', status: 'live', meta: 'Set 3 · 1:42', live: 'LIVE',
        a: { name: 'N. Adeyemi',  country: 'NGR', seed: '1',  sets: [4,6,2], pts: '0', serving: true },
        b: { name: 'P. Novak',    country: 'CZE', seed: '6',  sets: [6,4,3], pts: '15' } },
      { id: 'w2', status: 'final', meta: 'Final · 1:12',
        a: { name: 'C. Romano',   country: 'ITA', seed: '3',  sets: [6,6], winner: true },
        b: { name: 'H. Sørensen', country: 'DEN', seed: '14', sets: [2,1] } },
      { id: 'w3', status: 'upcoming', meta: 'Today · 17:30',
        a: { name: 'M. Ivanova',  country: 'BLR', seed: '10' },
        b: { name: 'J. Park',     country: 'KOR', seed: '13' } },
    ],
  },
  {
    name: 'Eastbourne Intl',
    tour: 'men',
    detail: 'ATP 250 · Quarterfinals · Grass',
    matches: [
      { id: 'e1', status: 'live', meta: 'Set 1 · 0:23', live: 'LIVE',
        a: { name: 'B. Müller',   country: 'AUT', seed: '4',  sets: [3], pts: 'Ad', serving: true },
        b: { name: 'O. Traoré',   country: 'CIV', seed: '—',  sets: [2], pts: '40' } },
      { id: 'e2', status: 'upcoming', meta: 'Today · 15:00',
        a: { name: 'G. Rossi',    country: 'ITA', seed: '1' },
        b: { name: 'A. Kovač',    country: 'SRB', seed: '7' } },
      { id: 'e3', status: 'upcoming', meta: 'Today · 18:45',
        a: { name: 'D. Schmidt',  country: 'GER', seed: '3' },
        b: { name: 'V. Horvat',   country: 'SLO', seed: '—' } },
    ],
  },
  {
    name: 'Bad Homburg Open',
    tour: 'women',
    detail: 'WTA 500 · Quarterfinals · Grass',
    matches: [
      { id: 'b1', status: 'live', meta: 'Set 2 · 1:08', live: 'LIVE',
        a: { name: 'S. Kovačević', country: 'CRO', seed: '2',  sets: [6,4], pts: '40', serving: true },
        b: { name: 'A. Bauer',     country: 'GER', seed: '—',  sets: [3,3], pts: '30' } },
      { id: 'b2', status: 'final', meta: 'Final · 1:31',
        a: { name: 'L. Fontaine',  country: 'FRA', seed: '1',  sets: [7,6], winner: true },
        b: { name: 'Y. Tan',       country: 'CHN', seed: '8',  sets: [5,3] } },
      { id: 'b3', status: 'upcoming', meta: 'Today · 16:15',
        a: { name: 'E. Larsson',   country: 'SWE', seed: '4' },
        b: { name: 'R. Mehta',     country: 'IND', seed: '—' } },
    ],
  },
];

// m: match. status 'live' | 'final' | 'upcoming'
// players: [A, B] each { name, country, seed, sets:[..], pts, serving, winner }
const tournamentsSlice = createSlice({
    name: 'tournaments',
    initialState,
    reducers: {}
});

export default tournamentsSlice.reducer;