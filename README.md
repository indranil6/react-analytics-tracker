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

## Event Debouncing

Click events are debounced to avoid multiple reports in quick succession. The debounce time is set to 300 milliseconds by default

## Heartbeat Reporting

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

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Changelog

All notable changes to this project will be documented in this section.

## Support

If you encounter any issues or have any questions, feel free to open an issue on the [GitHub repository](https://github.com/indranil6/react-analytics-tracker).

## Acknowledgments

- Thanks to the React community for their valuable feedback and contributions.

## Contact

For any inquiries or support, you can reach out to the maintainer at [indranilkundu6@gmail.com](mailto:indranilkundu6@gmail.com).

### Happy tracking!
