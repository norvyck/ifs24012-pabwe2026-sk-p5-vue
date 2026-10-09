# Architecture Diagram

Bidly is a client-side Vue application for an auction marketplace. Its diagrams show the browser-facing application layers and the feature components that connect the UI to the Delcom REST API.

## Application Architecture

<!-- mermaid-checked: no \n, no em-dash/en-dash, no {} in labels, subgraphs are id["label"], arrows are -->|"label"|, all subgraphs closed by end, ids unique -->
~~~mermaid
flowchart TD
    subgraph ClientLayer["Client Layer"]
        Browser["Web browser"]
        LocalStorage[("Browser local storage")]
    end
    subgraph ApplicationLayer["Vue application"]
        AppEntry["Vue 3 app"]
        Router["Vue Router"]
        Pages["Auction and account pages"]
        Stores["Pinia stores"]
        FeatureApi["Feature API adapters"]
        ApiHelper["Fetch API helper"]
        UiHelpers["Formatting and dialog helpers"]
        Markdown["Toast UI Markdown editor"]
    end
    subgraph ExternalLayer["External services"]
        Delcom["Delcom Auction REST API"]
        Media["Delcom uploaded media"]
    end

    Browser -->|"loads"| AppEntry
    AppEntry -->|"registers routes"| Router
    Router -->|"renders"| Pages
    Pages -->|"reads and updates"| Stores
    Pages -->|"uses dialogs and formatting"| UiHelpers
    Pages -->|"edits descriptions"| Markdown
    Stores -->|"calls feature operations"| FeatureApi
    FeatureApi -->|"sends requests"| ApiHelper
    ApiHelper -->|"authorized HTTP and JSON"| Delcom
    Stores -->|"persists session token and user"| LocalStorage
    Pages -->|"loads auction and profile images"| Media
~~~

### Technology Stack Summary

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| Runtime and package manager | Bun | 1.4.2 | Install dependencies and run scripts |
| Build and development | Vite | ^8.3.0 | Local server and production bundling |
| UI | Vue | ^3.5.42 | Reactive single-page application |
| Navigation | Vue Router | ^5.4.0 | Client-side routes and auth guard |
| State | Pinia | ^4.0.3 | Authentication, users, and auction state |
| Styling | Tailwind CSS and project CSS | ^4.3.3 | Responsive layout and visual design |
| Markdown | Toast UI Editor | ^3.2.2 | Auction description editing and rendering |
| Dialogs | SweetAlert2 | ^11.26.25 | Confirmation, success, and error feedback |
| Icons | Lucide Vue Next | ^1.0.0 | Interface icon components |
| Remote API | Delcom Auction REST API | External service | Authentication, users, auctions, bids, and media |

### Data Storage & External Services

The workspace contains no application database, cache, or message broker. Auction and account data are persisted by the Delcom REST API; the browser stores the access token and a cached user profile in `localStorage`. Auction covers and profile photos are uploaded through the API and served as remote media.

### Key Architectural Decisions

- Feature-oriented Vue modules keep authentication, auctions, and users with their own pages, API adapters, and Pinia stores.
- Vue Router handles navigation and protects authenticated routes; API requests attach the stored access token centrally.
- The app is a static single-page frontend, with the backend and persistent business data provided by the Delcom API.

## Component Relationships

<!-- mermaid-checked: no \n, no em-dash/en-dash, no {} in labels, subgraphs are id["label"], arrows are -->|"label"|, all subgraphs closed by end, ids unique -->
~~~mermaid
flowchart LR
    subgraph PresentationLayer["Presentation"]
        cAuthPages["Login and registration pages"]
        cAuctionPages["Auction list and detail pages"]
        cUserPages["User directory and profile pages"]
        cAuctionComponents["Navigation and auction cards"]
        cAuctionModals["Auction and bid modals"]
        cMarkdown["Markdown editor and viewer"]
    end
    subgraph StateLayer["Application state"]
        cAuthStore["Authentication store"]
        cAuctionStore["Auction store"]
        cUserStore["User store"]
        cRouter["Vue Router and auth guard"]
    end
    subgraph DataLayer["API adapters"]
        cAuthApi["Authentication API"]
        cAuctionApi["Auction API"]
        cUserApi["User API"]
        cApiHelper["Shared fetch API helper"]
    end
    subgraph UtilityLayer["Shared utilities"]
        cUiHelper["Formatting and dialogs"]
        cBrowserStorage[("Local storage")]
        cDelcom["Delcom REST API"]
    end

    cAuthPages -->|"login and registration"| cAuthStore
    cAuthPages -->|"navigate after authentication"| cRouter
    cAuctionPages -->|"loads and mutates auctions"| cAuctionStore
    cAuctionPages -->|"opens forms"| cAuctionModals
    cAuctionPages -->|"renders auction cards"| cAuctionComponents
    cAuctionPages -->|"formats messages and values"| cUiHelper
    cAuctionModals -->|"creates auctions and bids"| cAuctionStore
    cAuctionModals -->|"edits descriptions"| cMarkdown
    cUserPages -->|"loads and updates users"| cUserStore
    cUserPages -->|"formats dates and images"| cUiHelper
    cAuctionStore -->|"delegates auction operations"| cAuctionApi
    cAuthStore -->|"delegates session operations"| cAuthApi
    cUserStore -->|"delegates profile operations"| cUserApi
    cAuthStore -->|"reads and writes session"| cBrowserStorage
    cAuthApi -->|"sends requests"| cApiHelper
    cAuctionApi -->|"sends requests"| cApiHelper
    cUserApi -->|"sends requests"| cApiHelper
    cApiHelper -->|"HTTP requests with auth token"| cDelcom
    cRouter -.->|"guards protected pages"| cAuctionPages
~~~

### Component Inventory

| Component | Layer | Type | Responsibility |
|---|---|---|---|
| Login and registration pages | Presentation | Vue pages | Collect credentials and show auth results |
| Auction list and detail pages | Presentation | Vue pages | Search, filter, inspect, and manage auctions |
| User directory and profile pages | Presentation | Vue pages | Browse users and edit profile settings |
| Navigation and auction cards | Presentation | Vue components | Provide responsive navigation and auction summaries |
| Auction and bid modals | Presentation | Vue components | Validate and submit auction or bid forms |
| Markdown editor and viewer | Presentation | Vue components | Edit and render auction descriptions |
| Authentication store | Application state | Pinia store | Manage token, user, and auth operations |
| Auction store | Application state | Pinia store | Load and mutate auctions, covers, and bids |
| User store | Application state | Pinia store | Load directory and manage active profile |
| Vue Router and auth guard | Application state | Router | Resolve routes and redirect unauthenticated users |
| Authentication API | API adapters | Feature adapter | Call login, registration, and logout endpoints |
| Auction API | API adapters | Feature adapter | Call auction, cover, and bid endpoints |
| User API | API adapters | Feature adapter | Call directory, profile, photo, and password endpoints |
| Shared fetch API helper | API adapters | HTTP utility | Add auth headers, serialize requests, and handle errors |
| Formatting and dialogs | Shared utilities | UI utility | Format dates and prices; show confirmations and alerts |
| Local storage | Shared utilities | Browser storage | Persist access token and cached profile |
| Delcom REST API | External service | REST API | Provide persistent auction marketplace operations |
