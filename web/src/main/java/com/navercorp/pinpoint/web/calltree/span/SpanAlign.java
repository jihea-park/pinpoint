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

package com.navercorp.pinpoint.web.calltree.span;

import com.navercorp.pinpoint.common.server.bo.AnnotationBo;
import com.navercorp.pinpoint.common.server.bo.ExceptionInfo;
import com.navercorp.pinpoint.common.server.bo.SpanBo;
import com.navercorp.pinpoint.common.server.bo.SpanChunkBo;
import com.navercorp.pinpoint.common.server.bo.SpanEventBo;
import com.navercorp.pinpoint.common.util.StringUtils;
import org.apache.commons.collections4.CollectionUtils;

import java.util.List;
import java.util.Objects;

/**
 * @author emeroad
 * @author jaehong.kim
 */
public class SpanAlign implements Align {
    private final SpanBo spanBo;
    private final boolean hasChild;
    private final boolean meta;

    private int id;
    private long gap;
    private int depth;
    private long executionMilliseconds;

    public SpanAlign(SpanBo spanBo) {
        this(spanBo, false);
    }

    public SpanAlign(SpanBo spanBo, boolean meta) {
        this.spanBo = Objects.requireNonNull(spanBo, "spanBo");
        this.hasChild = hasChild0(spanBo);
        this.meta = meta;
    }

    private boolean hasChild0(SpanBo spanBo) {
        final List<SpanEventBo> spanEvents = spanBo.getSpanEventBoList();
        if (CollectionUtils.isNotEmpty(spanEvents)) {
            return true;
        }

        final List<SpanChunkBo> spanChunkBoList = spanBo.getSpanChunkBoList();
        if (CollectionUtils.isNotEmpty(spanChunkBoList)) {
            return true;
        }

        return false;
    }

    @Override
    public boolean isMeta() {
        return meta;
    }

    @Override
    public boolean isSpan() {
        return true;
    }

    @Override
    public SpanBo getSpanBo() {
        return spanBo;
    }

    @Override
    public SpanEventBo getSpanEventBo() {
        return null;
    }

    @Override
    public boolean hasChild() {
        return hasChild;
    }

    @Override
    public int getId() {
        return id;
    }

    @Override
    public void setId(int id) {
        this.id = id;
    }

    @Override
    public long getGap() {
        return gap;
    }

    @Override
    public void setGap(long gap) {
        this.gap = gap;
    }

    @Override
    public int getDepth() {
        return depth;
    }

    @Override
    public void setDepth(int depth) {
        this.depth = depth;
    }

    @Override
    public boolean isAsync() {
        return false;

    }

    @Override
    public boolean isAsyncFirst() {
        return false;
    }

    @Override
    public long getExecutionMilliseconds() {
        return executionMilliseconds;
    }

    @Override
    public void setExecutionMilliseconds(long executionMilliseconds) {
        this.executionMilliseconds = executionMilliseconds;
    }

    @Override
    public long getCollectorAcceptTime() {
        return spanBo.getCollectorAcceptTime();
    }

    @Override
    public byte getLoggingTransactionInfo() {
        return spanBo.getLoggingTransactionInfo();
    }

    @Override
    public long getEndTime() {
        return spanBo.getStartTime() + spanBo.getElapsed();
    }

    @Override
    public long getStartTime() {
        return spanBo.getStartTime();
    }

    @Override
    public long getElapsed() {
        return spanBo.getElapsed();
    }

    @Override
    public String getAgentId() {
        if (isMeta()) {
            return " ";
        }

        return spanBo.getAgentId();
    }

    @Override
    public String getAgentName() {
        final String def = " ";
        if (isMeta()) {
            return def;
        }

        final String agentName = spanBo.getAgentName();
        return StringUtils.isEmpty(agentName) ? def : agentName;
    }

    /**
     * @deprecated Since 3.1.0. Use {@link #getApplicationName()} instead.
     */
    @Deprecated
    @Override
    public String getApplicationId() {
        return getApplicationName();
    }

    @Override
    public String getApplicationName() {
        if (isMeta()) {
            return " ";
        }
        return spanBo.getApplicationName();
    }

    @Override
    public int getApplicationServiceType() {
        return spanBo.getApplicationServiceType();
    }

    @Override
    public long getAgentStartTime() {
        return spanBo.getAgentStartTime();
    }

    @Override
    public int getServiceType() {
        return spanBo.getServiceType();
    }

    @Override
    public String getTransactionId() {
        return spanBo.getTransactionId().toString();
    }

    @Override
    public long getSpanId() {
        return spanBo.getSpanId();
    }

    @Override
    public boolean hasException() {
        return spanBo.hasException();
    }

    @Override
    public String getExceptionClass() {
        return spanBo.getExceptionClass();
    }

    @Override
    public void setExceptionClass(String exceptionClass) {
        spanBo.setExceptionClass(exceptionClass);
    }

    @Override
    public ExceptionInfo getExceptionInfo() {
        return spanBo.getExceptionInfo();
    }

    @Override
    public String getRemoteAddr() {
        return spanBo.getRemoteAddr();
    }

    @Override
    public String getRpc() {
        return spanBo.getRpc();
    }

    @Override
    public int getApiId() {
        return spanBo.getApiId();
    }

    @Override
    public List<AnnotationBo> getAnnotationBoList() {
        return spanBo.getAnnotationBoList();
    }

    @Override
    public void setAnnotationBoList(List<AnnotationBo> annotationBoList) {
        spanBo.setAnnotationBoList(annotationBoList);
    }

    @Override
    public String getDestinationId() {
        return null;
    }

    @Override
    public int getAsyncId() {
        return -1;
    }

    @Override
    public String toString() {
        return "SpanAlign{" +
                "spanBo=" + spanBo.getSpanId() +
                ", hasChild=" + hasChild +
                ", meta=" + meta +
                ", id=" + id +
                ", gap=" + gap +
                ", depth=" + depth +
                ", executionMilliseconds=" + executionMilliseconds +
                '}';
    }

    public static class Builder {
        private final SpanBo spanBo;
        private boolean meta;
        private int id;
        private long gap;
        private int depth;
        private long executionMilliseconds;

        public Builder(SpanBo spanBo) {
            this.spanBo = spanBo;
        }

        public Builder enableMeta() {
            this.meta = true;
            return this;
        }

        public Builder disableMeta() {
            this.meta = false;
            return this;
        }

        public Builder setId(int id) {
            this.id = id;
            return this;
        }

        public Builder setGap(long gap) {
            this.gap = gap;
            return this;
        }

        public Builder setDepth(int depth) {
            this.depth = depth;
            return this;
        }

        public Builder setExecutionMilliseconds(long executionMilliseconds) {
            this.executionMilliseconds = executionMilliseconds;
            return this;
        }

        public SpanAlign build() {
            SpanAlign align = new SpanAlign(this.spanBo, meta);
            align.setId(this.id);
            align.setGap(this.gap);
            align.setDepth(this.depth);
            align.setExecutionMilliseconds(this.executionMilliseconds);
            return align;
        }
    }
}