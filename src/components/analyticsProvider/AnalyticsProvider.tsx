import React, { Component, createContext, RefObject } from "react";
import {
  AnalyticsTracker,
  AnalyticsTrackerProps,
} from "../analyticsTracker/AnalyticsTracker";

interface AnalyticsContextType {
  tracker: RefObject<AnalyticsTracker>;
}

const AnalyticsContext = createContext<AnalyticsContextType | null>(null);

export class AnalyticsProvider extends Component<AnalyticsTrackerProps> {
  private analyticsTrackerRef: RefObject<AnalyticsTracker>;

  constructor(props: AnalyticsTrackerProps) {
    super(props);
    this.analyticsTrackerRef = React.createRef<AnalyticsTracker>();
  }

  render() {
    const { children, ...trackerProps } = this.props;

    return (
      <AnalyticsContext.Provider value={{ tracker: this.analyticsTrackerRef }}>
        <AnalyticsTracker {...trackerProps} ref={this.analyticsTrackerRef}>
          {children}
        </AnalyticsTracker>
      </AnalyticsContext.Provider>
    );
  }
}

export const withAnalytics = <P extends object>(
  WrappedComponent: React.ComponentType<P>
) => {
  return class extends Component<
    P,
    { tracker: RefObject<AnalyticsTracker> | null }
  > {
    static contextType = AnalyticsContext;
    context!: React.ContextType<typeof AnalyticsContext>;

    constructor(props: P) {
      super(props);
      this.state = {
        tracker: null,
      };
    }

    componentDidMount() {
      if (this.context) {
        this.setState({ tracker: this.context.tracker });
      }
    }

    render() {
      const { tracker } = this.state;

      return (
        <WrappedComponent
          {...(this.props as P)}
          tracker={tracker?.current as AnalyticsTracker}
        />
      );
    }
  };
};
