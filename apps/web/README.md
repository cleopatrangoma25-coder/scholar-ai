# Scholar AI Web App

## Running the App Locally

To run the app with the mock server (which simulates the backend API), you have two options:

### Option 1: Run Both Services Concurrently (Recommended)
```bash
pnpm dev:full
```

This will start both the mock server (on port 3001) and the frontend (on port 3000) simultaneously.

### Option 2: Run Services Separately
In one terminal:
```bash
pnpm dev:mock
```

In another terminal:
```bash
pnpm dev
```

## What's Fixed

The issue where file uploads worked but questions didn't return feedback has been resolved by:

1. **Fixed QueryInterface**: Now uses the real tRPC client instead of mock implementation
2. **Updated Schema**: Fixed data structure mismatches between frontend and backend
3. **Enhanced UI**: Added proper display of query results in the Dashboard
4. **Mock Server**: Updated to provide realistic responses

## Testing the App

1. Start the app using one of the methods above
2. Navigate to `http://localhost:3000`
3. Upload a PDF file (it will be processed in the background)
4. Ask a question in the query interface
5. You should now see the response with mock data

## Troubleshooting

If you encounter issues:
- Make sure both the mock server (port 3001) and frontend (port 3000) are running
- Check the browser console for any errors
- Verify that the tRPC client is properly configured in `src/main.tsx` 