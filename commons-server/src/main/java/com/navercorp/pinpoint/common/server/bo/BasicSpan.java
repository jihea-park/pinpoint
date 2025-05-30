/*
 * Copyright 2019 NAVER Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.navercorp.pinpoint.common.server.bo;

import com.navercorp.pinpoint.common.profiler.util.TransactionId;

/**
 * @author Woonduk Kang(emeroad)
 */
public interface BasicSpan {

    int getVersion();

    String getAgentId();
    void setAgentId(String agentId);

    String getAgentName();
    void setAgentName(String agentName);

    /**
     * @deprecated Since 3.1.0. Use {@link #getApplicationName()} instead
     */
    @Deprecated
    String getApplicationId();

    /**
     * @deprecated Since 3.1.0. Use {@link #setApplicationName(String)} instead
     */
    @Deprecated
    void  setApplicationId(String applicationName);

    String getApplicationName();
    void setApplicationName(String applicationName);

    long getAgentStartTime();
    void setAgentStartTime(long agentStartTime);

    long getSpanId();
    void setSpanId(long spanId);

    TransactionId getTransactionId();
//    void setTransactionId(TransactionId transactionId);

    int getApplicationServiceType();
    void setApplicationServiceType(int applicationServiceType);
    boolean hasApplicationServiceType();

    long getCollectorAcceptTime();
    void setCollectorAcceptTime(long collectorAcceptTime);

//    List<SpanEventBo> getSpanEventBoList();
}
