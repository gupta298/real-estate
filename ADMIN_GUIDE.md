# Admin Guide - Managing Featured Listings and Off-Market Deals

## Overview

This guide explains how to manage featured listings and off-market deals as an admin user.

## Setting Up Admin Account

1. **Create an admin user:**
   ```bash
   npm run create-admin <email> <password>
   ```
   
   Example:
   ```bash
   npm run create-admin admin@blueflagrealty.com mypassword123
   ```

2. **Or update existing user to admin:**
   ```bash
   npm run create-admin your@email.com newpassword
   ```

## Accessing Admin Dashboard

1. Sign in with your admin account at the website
2. Click "Admin" link in the header (only visible to admin users)
3. You'll see the admin dashboard with two main sections:
   - **Featured Listings** - Manage which MLS listings are featured
   - **Off-Market Deals** - Create and manage off-market deals

## Managing Featured Listings

### What are Featured Listings?
Featured listings are regular MLS properties that you want to highlight and promote more prominently on your website. They appear on the homepage and are marked with a "Featured" badge.

### How to Feature a Listing:
1. Go to **Admin Dashboard** → **Featured Listings**
2. Browse or search for properties
3. Click **"Mark as Featured"** on any property you want to feature
4. Click **"Remove from Featured"** to unfeature a property

### Features:
- Search properties by title, address, or city
- Filter by: All Properties, Featured Only, Not Featured
- One-click toggle to feature/unfeature properties
- Visual indicator showing which properties are featured

## Managing Off-Market Deals

### What are Off-Market Deals?
Off-market deals are business opportunities, properties, or deals that are NOT listed on MLS. They're more like blog posts with:
- Free-form text content (like social media posts)
- Images
- Contact information
- No structured data (no bedrooms, bathrooms, etc.)

### Creating a New Off-Market Deal:

1. Go to **Admin Dashboard** → **Off-Market Deals**
2. Click **"Create New Deal"**
3. Fill out the form:
   - **Title** (required): Short title for the deal
   - **Content** (required): Full description - can use:
     - Line breaks (press Enter for new lines)
     - Emojis (🔥, 💰, 📍, etc.)
     - Any formatting you want
   - **Contact Information**: Name, title, phone, email
   - **Images**: Add image URLs (one at a time)
   - **Active**: Check to make it visible on public site
   - **Hot Deal**: Check to mark as 🔥 Hot Deal
   - **Display Order**: Number to control sorting (lower = first)

4. Click **"Create Deal"**

### Editing an Off-Market Deal:

1. Go to **Off-Market Deals** page
2. Click **"Edit"** on any deal
3. Make your changes
4. Click **"Update Deal"**

### Deleting an Off-Market Deal:

1. Go to **Off-Market Deals** page
2. Click the trash icon on any deal
3. Confirm deletion

### Example Off-Market Deal Content:

```
🔥Hot Deal Alert:🔥
🚀Liquor & Smoke Store Combo-Prime Location- INDIANAPOLIS

🔥 DEAL OF THE TOWN! 🔥
🍾 Premium Liquor Store + Smoke Shop Combo
📍 Prime Indianapolis Location

A powerhouse business opportunity now on the market! 💼💰

💨 Best Combo Deal
🚀 High Potential for Growth
💵 Perfect for entrepreneurs looking for a strong cash-flow business in a busy area!

📑 NDA + Proof of Funds Required
⚠️ Serious Inquiries Only

Contact Today:
👤 Jasvir "Jesse" Singh
       CEO / Broker
📱 317.499.1516 (Cell)
☎️ 317.517.5255 (Office)
🌐 BlueFlagIndy.com
🔵 Blue Rules! 🏙️💼
```

## Public Pages

### Featured Listings
- Featured listings automatically appear on the homepage
- They're also shown in regular property listings with a "Featured" badge

### Off-Market Deals
- Public page: `/off-market`
- Shows all active off-market deals
- Can filter by "All Deals" or "🔥 Hot Deals"
- Each deal displays with images, content, and contact information

## Tips

1. **Featured Listings**: Feature your best MLS properties to get more visibility
2. **Off-Market Deals**: Use these for exclusive deals, business opportunities, or properties not on MLS
3. **Hot Deals**: Mark your most important off-market deals as "Hot Deal" for extra visibility
4. **Display Order**: Use lower numbers (0, 1, 2) for deals you want to show first
5. **Active Status**: Uncheck "Active" to hide a deal without deleting it

## Security

- Only users with `role = 'admin'` can access admin pages
- All admin routes require authentication
- Admin access is checked on both frontend and backend

## Troubleshooting

**Can't see Admin link?**
- Make sure you're signed in
- Verify your account has `role = 'admin'` in the database
- Try signing out and back in

**Can't access admin pages?**
- Check that you're signed in
- Verify your session token is valid
- Check browser console for errors

**Need to create admin account?**
```bash
npm run create-admin your@email.com yourpassword
```

