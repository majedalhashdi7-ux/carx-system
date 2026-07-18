// Modular API structure
export { fetchAPI, type ApiResponse } from './api/index';
import { auth } from './api/auth';
import { cars } from './api/cars';
import { parts } from './api/parts';
export { auth, cars, parts };

import { api as originalApi } from './api-original';

export const users = originalApi.users;
export const analytics = originalApi.analytics;
export const auctions = originalApi.auctions;
export const bids = originalApi.bids;
export const dashboard = originalApi.dashboard;
export const orders = originalApi.orders;
export const invoices = originalApi.invoices;
export const upload = originalApi.upload;
export const brands = originalApi.brands;
export const favorites = originalApi.favorites;
export const reviews = originalApi.reviews;
export const messages = originalApi.messages;
export const comparisons = originalApi.comparisons;
export const contact = originalApi.contact;
export const liveAuctions = originalApi.liveAuctions;
export const liveAuctionRequests = originalApi.liveAuctionRequests;
export const smartAlerts = originalApi.smartAlerts;
export const settings = originalApi.settings;
export const concierge = originalApi.concierge;
export const showroom = originalApi.showroom;
export const notifications = originalApi.notifications;
export const security = originalApi.security;
export const importSystem = originalApi.import;

export const api = {
    auth,
    cars,
    parts,
    users,
    analytics,
    auctions,
    bids,
    dashboard,
    orders,
    invoices,
    upload,
    brands,
    favorites,
    reviews,
    messages,
    comparisons,
    contact,
    liveAuctions,
    liveAuctionRequests,
    smartAlerts,
    settings,
    concierge,
    showroom,
    notifications,
    security,
    import: importSystem,
};
