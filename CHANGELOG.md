# react-analytics-tracker

## Changelog

<table>
  <thead>
    <tr>
      <th>Date</th>
      <th>Version</th>
      <th>Description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>2024-07-05</td>
      <td>1.0.0</td>
      <td>Initial release of react-analytics-tracker package</td>
    </tr>
    <tr>
      <td>2024-07-06</td>
      <td>1.0.2</td>
      <td>
       <ul>
        <li>Added TypeScript support</li>
        <li> Introduced interfaces for `AnalyticsPayload` to facilitate type-safe usage of `onReport` function.
        <li>Updated documentation for `AnalyticsPayload` interface usage in `onReport`.
      </td>
    </tr>
    <tr>
      <td>2024-07-07</td>
      <td>1.0.3</td>
      <td>
        <ul>
        <li>Added withAnalytics HOC: Introduced withAnalytics higher-order component for integrating analytics tracking into functional components.
        </li>
        <li>Implemented AnalyticsProvider: Created AnalyticsProvider class component to manage analytics tracking across the application, enabling access to the tracking instance via context.
        </li>
        <li>Enhanced Custom Event Tracking: Extended event tracking capabilities to support custom events across different components using the trackCustomEvent method.
        </li>
        </ul>
      </td>
    </tr>
    <tr>
      <td>2024-07-12</td>
      <td>1.0.4</td>
      <td>
        <ul>
        <li>Added tracking support for other mouse, form, input and touch events
        </li>
        <li>Implemented failedCount flag for each event. If an event fails to report, it is stored in sessionStorage and its failedCount is incremented. Events with a failedCount of 3 or more are discarded to avoid infinite loops and data overload.
        </li>
        </ul>
      </td>
    </tr>
  </tbody>
</table>
