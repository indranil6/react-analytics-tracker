# react-analytics-tracker

`react-analytics-tracker` is a React component for tracking user interactions and events on your web application. This component captures click and view events, collects various data points, and reports them to a specified endpoint.

## Installation

Install the package via npm:

```bash
npm install react-analytics-tracker

```

or via yarn:

```bash
yarn add react-analytics-tracker
```

## Usage

To use the AnalyticsTracker component, wrap it around your application or specific parts of your application where you want to track user interactions.

## Basic Example

```jsx
import React from "react";
import ReactDOM from "react-dom";
import { AnalyticsTracker } from "react-analytics-tracker";

const App = () => (
  <AnalyticsTracker
    appName="MyApp"
    appVersion="1.0.0"
    reportingEndpoint="https://your-endpoint.com/report"
  >
    {/* Your application components */}
  </AnalyticsTracker>
);

ReactDOM.render(<App />, document.getElementById("root"));
```

## Track Your Component View

To track a component view, add the `data-component` attribute to the component element. Optionally, include additional data using the `data-component-data` attribute.

Example:

```jsx
<div data-component="YourComponent" data-component-data="additionalData">
  {/* Your component content */}
</div>
```

## Track Your Clicks

To track a click event, add the `data-element` attribute to the clickable element. If `data-element` is not present, the tag name of the element will be used for tracking. Optionally, include extra data using the `data-element-data` attribute.

Example:

```jsx
<button data-element="ButtonElement" data-element-data="extraData">
  Click me
</button>
```

## Props

The `AnalyticsTracker` component accepts the following props:

- `appName` (optional) : Specifies the application name to include in the analytics payload sent to the server

- `appName` (optional) : Specifies the application version to include in the analytics payload sent to the server

- `heartBeatInterval` (optional): Specifies the interval (in milliseconds) for sending periodic heartbeat reports. Defaults to 4000 milliseconds.

- `customPayload` (optional): An object containing custom data to include in the analytics payload sent to the server.

- `customProperties` (optional): An object containing custom properties to add to each tracked event in the analytics payload.

- `reportingEndpoint` (optional): If provided, specifies the endpoint where the analytics payload will be POSTed. Either `reportingEndpoint` or `onReport` is required for reporting.

- `onReport` (optional): A function that will be called when reporting analytics data. Use this for manual handling of analytics data if `reportingEndpoint` is not provided or for additional logic alongside endpoint reporting.

Example usage:

```jsx
<AnalyticsTracker
  heartBeatInterval={5000}
  customPayload={{ projectId: "12345" }}
  reportingEndpoint="https://example.com/analytics"
  onReport={(payload) => {
    console.log("Custom onReport function called with payload:", payload);
    // Additional logic can be added here
  }}
>
  {/* Your application components */}
</AnalyticsTracker>
```

## Customization

### Custom Payload

You can customize the payload sent to the reporting endpoint by passing a `customPayload` prop to the `AnalyticsTracker` component.

```jsx
<AnalyticsTracker
  appName="MyApp"
  appVersion="1.0.0"
  reportingEndpoint="https://your-endpoint.com/report"
  customPayload={{ userId: "12345", additionalInfo: "extra data" }}
>
  <YourComponent />
</AnalyticsTracker>
```

### Custom Properties

You can include custom properties with each tracked event by passing a customProperties prop to the AnalyticsTracker component.

```jsx
<AnalyticsTracker
  appName="MyApp"
  appVersion="1.0.0"
  reportingEndpoint="https://your-endpoint.com/report"
  customProperties={{ environment: "production" }}
>
  <YourComponent />
</AnalyticsTracker>
```

## How it works

The react-analytics-tracker package provides a way to track user interactions and page views within a React application. It leverages various web APIs and techniques to gather and report analytics data effectively. Here’s an overview of its functionality:

### Session Management

Upon initialization, AnalyticsTracker generates a unique session ID (sessionId) for each user. This ID is stored in sessionStorage to track user sessions across different page views.

### Event Tracking

#### Click Events

When a user clicks on an element in the DOM, the AnalyticsTracker captures the event details such as coordinates, element attributes (data-element), and contextual information. These events are queued and reported periodically or immediately if configured.

#### Viewport Visibility

Using the IntersectionObserver, the tracker monitors when components become visible in the viewport (view events). It calculates the percentage of the component visible and reports this information along with optional additional data (data-component-data).

#### Reporting

The tracker allows reporting of accumulated events to either a specified reportingEndpoint via HTTP POST requests or to a custom handler (onReport function) for manual processing. This flexibility enables integration with various analytics services or custom backend systems.

#### Network and User Environment

The tracker also captures details about the user’s network connection (navigator.connection) and environment (screen size, language) to provide additional context to analytics reports.

#### Event Debouncing

Click events are debounced to avoid multiple reports in quick succession. The debounce time is set to 300 milliseconds by default

#### Heartbeat Reporting

The component sends periodic heartbeat reports to the endpoint to keep track of the session. The default interval is 4000 milliseconds (4 seconds). You can customize this interval by passing a heartBeatInterval prop.

```jsx
<AnalyticsTracker
  appName="MyApp"
  appVersion="1.0.0"
  reportingEndpoint="https://your-endpoint.com/report"
  heartBeatInterval={10000} // 10 seconds
>
  <YourComponent />
</AnalyticsTracker>
```

## Payload Generation

The payload object used in react-analytics-tracker encapsulates various pieces of information about the user’s interaction and environment. Here’s an interface that describes the structure of the payload object:

```tsx
interface AnalyticsPayload {
  referrer: string; // Referring URL of the current page
  url: string; // Current URL
  pathname: string; // Path part of the URL
  hostname: string; // Hostname of the current URL
  title: string; // Title of the current document
  screen: string; // Screen dimensions (width x height)
  language: string; // User's preferred language
  utmSource: string; // UTM source parameter from cookies
  utmMedium: string; // UTM medium parameter from cookies
  utmCampaign: string; // UTM campaign parameter from cookies
  utmTerm: string; // UTM term parameter from cookies
  utmContent: string; // UTM content parameter from cookies
  sessionId: string; // Unique session identifier
  network: {
    // Network connection details
    rtt: number | undefined; // Round-trip time
    type: string | undefined; // Connection type
    saveData: boolean | undefined; // Data-saving mode
    downLink: number | undefined; // Downlink speed
    effectiveType: string | undefined; // Effective connection type
    isOnline: boolean; // Online status
  };
  events: Array<{
    // Array of tracked events
    data: string; // Event data (JSON stringified)
    event: string; // Event type ('click' or 'view')
    element: string | null; // Element name or tag name
    component: string; // Component name
    timestamp: number; // Timestamp of the event
    [key: string]: any; // Additional custom properties
  }>;
  [key: string]: any; // Additional custom properties
}
```

### Usage

When using the onReport function callback or customizing the payload structure, developers should import AnalyticsPayload and reference it as follows:

```tsx
import { AnalyticsPayload } from "react-analytics-tracker";

// Example usage of onReport with AnalyticsPayload
const handleReport = (payload: AnalyticsPayload) => {
  // Implement custom logic to handle the payload
  console.log("Reporting payload:", payload);
};

// Usage within your AnalyticsTracker component
<AnalyticsTracker onReport={handleReport}>
  {/* Your application components */}
</AnalyticsTracker>;
```

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Changelog

### Version 1.0.1 (06-07-2024)

- Added TypeScript support.
- Introduced interfaces for `AnalyticsPayload` to facilitate type-safe usage of `onReport` function.
- Updated documentation for `AnalyticsPayload` interface usage in `onReport`.

## Support

If you encounter any issues or have any questions, feel free to open an issue on the [GitHub repository](https://github.com/indranil6/react-analytics-tracker).

## Acknowledgments

- Thanks to the React community for their valuable feedback and contributions.

## Contact

For any inquiries or support, you can reach out to the maintainer at [indranilkundu6@gmail.com](mailto:indranilkundu6@gmail.com).

### Happy tracking!
