import React, { useEffect, ReactNode } from "react";

interface AnalyticsTrackerProps {
  children: ReactNode;
}

const AnalyticsTracker: React.FC<AnalyticsTrackerProps> = ({ children }) => {
  useEffect(() => {
    const trackEvent = (eventName: string, data: any) => {
      console.log(`Event: ${eventName}`, data);
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
        trackEvent("click", { data, element: elementName });
      }
    };

    const handleIntersect = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const componentName = entry.target.getAttribute("data-component");
          console.log("Tracking view event...");
          console.log("Component:", componentName);
          trackEvent("view", { component: componentName });
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

    return () => {
      document.removeEventListener("click", handleClick);
      mutationObserver.disconnect();
      observer.disconnect();
    };
  }, []);

  return <>{children}</>;
};

export default AnalyticsTracker;
