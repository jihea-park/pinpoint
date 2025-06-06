/*
 * Copyright 2014 NAVER Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.navercorp.pinpoint.web.applicationmap.histogram;

import com.google.common.collect.Ordering;
import com.google.common.primitives.Doubles;
import com.navercorp.pinpoint.common.server.util.json.JsonField;
import com.navercorp.pinpoint.common.server.util.json.JsonFields;
import com.navercorp.pinpoint.common.timeseries.array.DoubleArray;
import com.navercorp.pinpoint.common.timeseries.point.DataPoint;
import com.navercorp.pinpoint.common.timeseries.point.Points;
import com.navercorp.pinpoint.common.timeseries.window.TimeWindow;
import com.navercorp.pinpoint.common.timeseries.window.TimeWindows;
import com.navercorp.pinpoint.web.applicationmap.rawdata.AgentHistogram;
import com.navercorp.pinpoint.web.applicationmap.rawdata.AgentHistogramList;
import com.navercorp.pinpoint.web.applicationmap.view.TimeHistogramBuilder;
import com.navercorp.pinpoint.web.applicationmap.view.TimeHistogramViewModel;
import com.navercorp.pinpoint.web.view.id.AgentNameView;
import com.navercorp.pinpoint.web.vo.Application;
import com.navercorp.pinpoint.web.vo.stat.SampledApdexScore;
import com.navercorp.pinpoint.web.vo.stat.chart.application.ApplicationStatPoint;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

/**
 * most of the features have been delegated to AgentHistogramList upon refactoring
 * TODO: functionality reduced to creating views - need to be renamed or removed
 *
 * @author emeroad
 */
public class AgentTimeHistogram {

    private static final double DEFAULT_MIN_APDEX_SCORE = 2D;
    private static final double DEFAULT_MAX_APDEX_SCORE = -2D;
    private static final String DEFAULT_AGENT_ID = "defaultAgentId";

    private static final Comparator<JsonField<AgentNameView, List<TimeHistogramViewModel>>> AGENT_NAME_COMPARATOR
            = Comparator.comparing((jsonField) -> jsonField.name().agentName());

    private static final Ordering<TimeHistogram> histogramOrdering = Ordering.from(TimeHistogram.TIME_STAMP_ASC_COMPARATOR);

    private final Application application;
    private final AgentHistogramList agentHistogramList;

    public AgentTimeHistogram(Application application) {
        this.application = Objects.requireNonNull(application, "application");
        this.agentHistogramList = new AgentHistogramList();
    }

    public AgentTimeHistogram(Application application, AgentHistogramList agentHistogramList) {
        this.application = Objects.requireNonNull(application, "application");
        this.agentHistogramList = Objects.requireNonNull(agentHistogramList, "agentHistogramList");
    }

    public JsonFields<AgentNameView, List<TimeHistogramViewModel>> createViewModel(TimeHistogramFormat timeHistogramFormat) {

        JsonFields.Builder<AgentNameView, List<TimeHistogramViewModel>> builder = JsonFields.newBuilder();
        builder.comparator(AGENT_NAME_COMPARATOR);
        for (AgentHistogram agentHistogram : agentHistogramList.getAgentHistogramList()) {
            Application agentId = agentHistogram.getAgentId();
            List<TimeHistogram> timeList = histogramOrdering.sortedCopy(agentHistogram.getTimeHistogram());
            JsonField<AgentNameView, List<TimeHistogramViewModel>> model = createAgentResponseTimeViewModel(agentId, timeList, timeHistogramFormat);
            builder.addField(model);
        }
        return builder.build();
    }

    public Map<String, List<TimeHistogram>> getTimeHistogramMap() {
        Map<String, List<TimeHistogram>> result = new HashMap<>();
        for (AgentHistogram agentHistogram : agentHistogramList.getAgentHistogramList()) {
            List<TimeHistogram> histogram = histogramOrdering.sortedCopy(agentHistogram.getTimeHistogram());
            result.put(agentHistogram.getAgentId().getName(), histogram);
        }
        return result;
    }


    private JsonField<AgentNameView, List<TimeHistogramViewModel>> createAgentResponseTimeViewModel(Application agentName, List<TimeHistogram> timeHistogramList, TimeHistogramFormat timeHistogramFormat) {
        List<TimeHistogramViewModel> responseTimeViewModel = createResponseTimeViewModel(timeHistogramList, timeHistogramFormat);
        return JsonField.of(AgentNameView.of(agentName), responseTimeViewModel);
    }

    private List<TimeHistogramViewModel> createResponseTimeViewModel(List<TimeHistogram> timeHistogramList, TimeHistogramFormat timeHistogramFormat) {
        TimeHistogramBuilder builder = new TimeHistogramBuilder(timeHistogramFormat);
        return builder.build(application, timeHistogramList);
    }

    public List<SampledApdexScore> getSampledAgentApdexScoreList(String agentName) {
        AgentHistogram agentHistogram = selectAgentHistogram(agentName);
        if (agentHistogram == null) {
            return List.of();
        }

        List<SampledApdexScore> result = new ArrayList<>();
        for (TimeHistogram timeHistogram : agentHistogram.getTimeHistogram()) {
            if (timeHistogram.getTotalCount() != 0) {
                DataPoint<Double> agentStatPoint = Points.of(timeHistogram.getTimeStamp(), ApdexScore.calculateApdexScore(timeHistogram));
                result.add(new SampledApdexScore(agentStatPoint));
            }
        }
        return result;
    }

    private AgentHistogram selectAgentHistogram(String agentName) {
        for (AgentHistogram agentHistogram : agentHistogramList.getAgentHistogramList()) {
            Application agentId = agentHistogram.getAgentId();
            if (agentId.getName().equals(agentName)) {
                return agentHistogram;
            }
        }
        return null;
    }

    public List<ApplicationStatPoint> getApplicationApdexScoreList(TimeWindow window) {
        int size = window.getWindowRangeCount();
        double[] min = DoubleArray.newArray(size, DEFAULT_MIN_APDEX_SCORE);
        List<String> minAgentId = fillList(size, DEFAULT_AGENT_ID);
        double[] max = DoubleArray.newArray(size, DEFAULT_MAX_APDEX_SCORE);
        List<String> maxAgentId = fillList(size, DEFAULT_AGENT_ID);

        List<Histogram> sumHistogram = TimeWindows.createInitialPoints(window, this::histogram);

        for (AgentHistogram agentHistogram : agentHistogramList.getAgentHistogramList()) {
            for (TimeHistogram timeHistogram : agentHistogram.getTimeHistogram()) {
                if (timeHistogram.getTotalCount() != 0) {
                    final int index = window.getWindowIndex(timeHistogram.getTimeStamp());
                    if (index < 0 || index >= size) {
                        continue;
                    }
                    double apdex = ApdexScore.calculateApdexScore(timeHistogram);
                    String agentId = agentHistogram.getId();

                    updateMin(index, apdex, agentId, min, minAgentId);
                    updateMax(index, apdex, agentId, max, maxAgentId);
                    sumHistogram.get(index).add(timeHistogram);
                }
            }
        }

        return createApplicationStatPoints(window, Doubles.asList(min), minAgentId, Doubles.asList(max), maxAgentId, sumHistogram);
    }

    private <T> List<T> fillList(int size, T defaultValue) {
        return new ArrayList<>(Collections.nCopies(size, defaultValue));
    }

    private Histogram histogram(long timestamp) {
        return new TimeHistogram(application.getServiceType(), timestamp);
    }

    private void updateMin(int index, double apdex, String agentId, double[] min, List<String> minAgentId) {
        if (min[index] > apdex) {
            min[index] = apdex;
            minAgentId.set(index, agentId);
        }
    }

    private void updateMax(int index, double apdex, String agentId, double[] max, List<String> maxAgentId) {
        if (max[index] < apdex) {
            max[index] = apdex;
            maxAgentId.set(index, agentId);
        }
    }

    private List<ApplicationStatPoint> createApplicationStatPoints(TimeWindow window,
                                                                   List<Double> min, List<String> minAgentId,
                                                                   List<Double> max, List<String> maxAgentId,
                                                                   List<Histogram> sumHistogram) {
        List<ApplicationStatPoint> applicationStatPoints = new ArrayList<>();
        for (long timestamp : window) {
            int index = window.getWindowIndex(timestamp);
            Histogram histogram = sumHistogram.get(index);
            if (histogram.getTotalCount() != 0) {
                double avg = ApdexScore.calculateApdexScore(histogram);
                ApplicationStatPoint point = new ApplicationStatPoint(timestamp, min.get(index), minAgentId.get(index), max.get(index), maxAgentId.get(index), avg);
                applicationStatPoints.add(point);
            }
        }
        return applicationStatPoints;
    }

}
