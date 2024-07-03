import React, { useEffect } from "react";

const withViewTracker = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName: string
) => {
  return (props: P) => {
    useEffect(() => {
      const handleIntersect = (entries: IntersectionObserverEntry[]) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            trackEvent("view", { component: componentName });
          }
        });
      };

      const observer = new IntersectionObserver(handleIntersect, {
        threshold: 0.1,
      });
      const element = document.querySelector(
        `[data-component="${componentName}"]`
      );
      if (element) {
        observer.observe(element);
      }

      return () => {
        if (element) {
          observer.unobserve(element);
        }
      };
    }, []);

    const trackEvent = (eventName: string, data: any) => {
      console.log(`Event: ${eventName}`, data);
    };

    return <WrappedComponent {...props} />;
  };
};

export default withViewTracker;
