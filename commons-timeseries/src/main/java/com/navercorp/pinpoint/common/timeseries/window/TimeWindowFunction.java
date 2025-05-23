package com.navercorp.pinpoint.common.timeseries.window;


@FunctionalInterface
public interface TimeWindowFunction {

    TimeWindowFunction ALL_IN_ONE = (timestamp) -> 0;


    long refineTimestamp(long timestamp);


    static TimeWindowFunction identity() {
        return timestamp -> timestamp;
    }

}
