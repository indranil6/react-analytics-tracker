import React, { useEffect } from "react";
import {
  AnalyticsTrackerProps,
  EventDetails,
  //   NetworkConnection,
  //   NetworkConnectionInfo,
  TrackEventData,
} from "../models/interfaces";

let intervalid: any;
let visibilityChange: string;
let REPORT_HEARTBEAT_INTERVAL: number = 4000;
let eventCollections: EventDetails[] = [];
const AnalyticsTracker: React.FC<AnalyticsTrackerProps> = ({
  appName,
  appVersion,
  reportingEndpoint,
  children,
}) => {
  //   function getNetworkConnection(): NetworkConnection | null {
  //     if (typeof navigator === "undefined") return null;
  //     return (
  //       (navigator as any).connection ||
  //       (navigator as any).mozConnection ||
  //       (navigator as any).webkitConnection ||
  //       null
  //     );
  //   }

  //   function getNetworkConnectionInfo(): NetworkConnectionInfo {
  //     const connection = getNetworkConnection();
  //     if (!connection) {
  //       return {
  //         isOnline: typeof navigator !== "undefined" ? navigator.onLine : false,
  //       };
  //     }
  //     return {
  //       rtt: connection.rtt,
  //       type: connection.type,
  //       saveData: connection.saveData,
  //       downLink: connection.downLink,
  //       effectiveType: connection.effectiveType,
  //       isOnline: navigator.onLine,
  //     };
  //   }

  const report = async (callback = () => {}) => {
    let response = await fetch(reportingEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(eventCollections),
    });
    if (response.ok) {
      eventCollections.length = 0;
      callback();
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    const trackEvent = (eventName: string, data: TrackEventData) => {
      console.log(`Event: ${eventName}`, data);
      if (eventName === "view") {
        console.log("Tracking view event...");
        if (eventCollections.length > 4) {
          report(() => {
            eventCollections.push({
              data: data.eventData ? JSON.stringify(data.eventData) : "",
              event: eventName,
              element: data.elementName,
              component: data.componentName,
            });
          });
        } else {
          eventCollections.push({
            data: data.eventData ? JSON.stringify(data.eventData) : "",
            event: eventName,
            element: data.elementName,
            component: data.componentName,
          });
        }
      } else if (eventName === "click") {
        console.log("Tracking click event...");
        let postData: EventDetails[] = [];
        postData.push({
          data: data.eventData ? JSON.stringify(data.eventData) : "",
          event: eventName,
          element: data.elementName,
          component: data.componentName,
        });
        eventCollections = eventCollections.concat(postData);
        report();
      }
    };

    const handleClick = (event: MouseEvent) => {
      console.log("Click event caught!");
      const target = (event.target as HTMLElement).closest("[data-component]");

      if (target) {
        const elementName =
          (event.target as HTMLElement).getAttribute("data-element") ||
          (event.target as HTMLElement).tagName;

        const data = (event.target as HTMLElement).getAttribute(
          "data-element-data"
        );
        console.log("Tracking click event...");
        console.log("Component:", elementName);
        console.log("Data:", data);
        trackEvent("click", { eventData: data, elementName });
      }
    };

    const handleIntersect = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const componentName = entry.target.getAttribute("data-component");
          const data = (entry.target as HTMLElement).getAttribute(
            "data-element-data"
          );
          console.log("Tracking view event...");
          console.log("Component:", componentName);
          trackEvent("view", { eventData: data, componentName });
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersect, {
      threshold: 0.1,
    });

    const observeNewComponents = (mutationsList: MutationRecord[]) => {
      mutationsList.forEach((mutation) => {
        console.log("Mutation Type:", mutation.type);
        if (mutation.type === "childList") {
          console.log("Added Nodes:", mutation.addedNodes);
          mutation.addedNodes.forEach((node) => {
            if (
              node.nodeType === 1 &&
              (node as HTMLElement).hasAttribute("data-component")
            ) {
              console.log("Observing Node:", node);
              observer.observe(node as Element);
            }
            (node as HTMLElement)
              .querySelectorAll("[data-component]")
              .forEach((childNode) => {
                console.log("Observing Child Node:", childNode);
                observer.observe(childNode);
              });
          });
        }
      });
    };

    const mutationObserver = new MutationObserver(observeNewComponents);
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    document
      .querySelectorAll("[data-component]")
      .forEach((component) => observer.observe(component));

    document.addEventListener("click", handleClick);
    // const handleVisibilityChange = () => {
    //   if (document.visibilityState == "hidden") {
    //     report();
    //   }
    // };
    // if (typeof document.hidden !== "undefined") {
    //   visibilityChange = "visibilitychange";
    // } else if (typeof (document as any).msHidden !== "undefined") {
    //   visibilityChange = "msvisibilitychange";
    // } else if (typeof (document as any).webkitHidden !== "undefined") {
    //   visibilityChange = "webkitvisibilitychange";
    // }
    // document.addEventListener(visibilityChange, handleVisibilityChange);
    // intervalid = setInterval(() => {
    //   report();
    // }, REPORT_HEARTBEAT_INTERVAL);

    return () => {
      document.removeEventListener("click", handleClick);
      mutationObserver.disconnect();
      observer.disconnect();
      if (intervalid) {
        clearInterval(intervalid);

        report();
      }

      //   document.removeEventListener(visibilityChange, handleVisibilityChange);
    };
  }, []);

  return <>{children}</>;
};

export default AnalyticsTracker;
