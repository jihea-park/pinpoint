/*
 * Copyright 2018 NAVER Corp.
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

package com.navercorp.pinpoint.bootstrap.plugin.request;

import com.navercorp.pinpoint.bootstrap.context.Header;
import com.navercorp.pinpoint.bootstrap.context.TraceContext;
import com.navercorp.pinpoint.bootstrap.context.TraceId;
import com.navercorp.pinpoint.bootstrap.logging.PluginLogManager;
import com.navercorp.pinpoint.bootstrap.logging.PluginLogger;
import com.navercorp.pinpoint.bootstrap.sampler.SamplingFlagUtils;
import com.navercorp.pinpoint.common.util.StringUtils;

import java.util.Objects;

/**
 * @author jaehong.kim
 */
public class DefaultRequestTraceWriter<T> implements RequestTraceWriter<T> {

    private static final String NOT_SET = null;

    private final PluginLogger logger = PluginLogManager.getLogger(this.getClass());
    private final boolean isDebug = logger.isDebugEnabled();
    private final ClientHeaderAdaptor<T> clientHeaderAdaptor;
    private final String applicationName;
    private final short serverTypeCode;
    private final String clusterNamespace;

    public DefaultRequestTraceWriter(ClientHeaderAdaptor<T> clientHeaderAdaptor, TraceContext traceContext) {
        this(clientHeaderAdaptor, traceContext.getApplicationName(), traceContext.getServerTypeCode(), traceContext.getClusterNamespace());
    }

    public DefaultRequestTraceWriter(ClientHeaderAdaptor<T> clientHeaderAdaptor, String applicationName, short serverTypeCode, String clusterNamespace) {
        this.clientHeaderAdaptor = Objects.requireNonNull(clientHeaderAdaptor, "clientHeaderAdaptor");

        this.applicationName = Objects.requireNonNull(applicationName, "applicationName");
        this.serverTypeCode = serverTypeCode;
        this.clusterNamespace = StringUtils.defaultIfEmpty(clusterNamespace, NOT_SET);
    }

    @Override
    public void write(T header) {
        if (isDebug) {
            logger.debug("Set request header that is not to be sampled.");
        }
        clientHeaderAdaptor.setHeader(header, Header.HTTP_SAMPLED.toString(), SamplingFlagUtils.SAMPLING_RATE_FALSE);
    }

    // Set transaction information in the request.
    @Override
    public void write(T header, final TraceId traceId, final String host) {
        Objects.requireNonNull(traceId, "traceId");

        if (isDebug) {
            logger.debug("Set request header. traceId={}, applicationName={}, serverTypeCode={}, clusterNamespace={}", traceId, applicationName, serverTypeCode, clusterNamespace);
        }
        clientHeaderAdaptor.setHeader(header, Header.HTTP_TRACE_ID.toString(), traceId.getTransactionId());
        clientHeaderAdaptor.setHeader(header, Header.HTTP_SPAN_ID.toString(), String.valueOf(traceId.getSpanId()));
        clientHeaderAdaptor.setHeader(header, Header.HTTP_PARENT_SPAN_ID.toString(), String.valueOf(traceId.getParentSpanId()));
        clientHeaderAdaptor.setHeader(header, Header.HTTP_FLAGS.toString(), String.valueOf(traceId.getFlags()));
        clientHeaderAdaptor.setHeader(header, Header.HTTP_PARENT_APPLICATION_NAME.toString(), applicationName);
        clientHeaderAdaptor.setHeader(header, Header.HTTP_PARENT_APPLICATION_TYPE.toString(), Short.toString(serverTypeCode));

        if (clusterNamespace != NOT_SET) {
            clientHeaderAdaptor.setHeader(header, Header.HTTP_PARENT_APPLICATION_NAMESPACE.toString(), clusterNamespace);
        }

        if (host != null) {
            clientHeaderAdaptor.setHeader(header, Header.HTTP_HOST.toString(), host);
        }
    }

    public boolean isNested(T header) {
        if (clientHeaderAdaptor.contains(header, Header.HTTP_TRACE_ID.toString())) {
            // sampled
            return true;
        }

        if (clientHeaderAdaptor.contains(header, Header.HTTP_SAMPLED.toString())) {
            // unsampled
            return true;
        }

        return false;
    }
}