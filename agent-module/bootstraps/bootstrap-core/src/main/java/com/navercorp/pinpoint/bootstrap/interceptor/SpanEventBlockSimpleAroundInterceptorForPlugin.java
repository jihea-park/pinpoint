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

package com.navercorp.pinpoint.bootstrap.interceptor;

import com.navercorp.pinpoint.bootstrap.context.MethodDescriptor;
import com.navercorp.pinpoint.bootstrap.context.SpanEventRecorder;
import com.navercorp.pinpoint.bootstrap.context.Trace;
import com.navercorp.pinpoint.bootstrap.context.TraceBlock;
import com.navercorp.pinpoint.bootstrap.context.TraceContext;

import java.util.Objects;

public abstract class SpanEventBlockSimpleAroundInterceptorForPlugin extends AbstractSpanEventInterceptorForPlugin implements BlockAroundInterceptor {
    protected final MethodDescriptor methodDescriptor;

    protected SpanEventBlockSimpleAroundInterceptorForPlugin(TraceContext traceContext, MethodDescriptor methodDescriptor) {
        super(traceContext);
        this.methodDescriptor = Objects.requireNonNull(methodDescriptor, "methodDescriptor");
    }

    @Override
    public TraceBlock before(Object target, Object[] args) {
        if (isDebug) {
            logBeforeInterceptor(target, args);
        }

        prepareBeforeTrace(target, args);

        final Trace trace = currentTrace();
        if (trace == null) {
            return null;
        }

        final TraceBlock traceBlock = trace.getTraceBlock();
        try {
            if (checkBeforeTraceBlockBegin(trace, target, args)) {
                traceBlock.begin();
                beforeTrace(trace, traceBlock, target, args);
                doInBeforeTrace(traceBlock, target, args);
            }
        } catch (Throwable th) {
            if (logger.isWarnEnabled()) {
                logger.warn("BEFORE. Caused:{}", th.getMessage(), th);
            }
        }

        return traceBlock;
    }

    protected void prepareBeforeTrace(Object target, Object[] args) {
    }

    protected boolean checkBeforeTraceBlockBegin(Trace trace, Object target, Object[] args) {
        return true;
    }

    protected void beforeTrace(Trace trace, SpanEventRecorder recorder, Object target, Object[] args) {
    }

    protected abstract void doInBeforeTrace(final SpanEventRecorder recorder, final Object target, final Object[] args) throws Exception;

    @Override
    public void after(TraceBlock block, Object target, Object[] args, Object result, Throwable throwable) {
        if (isDebug) {
            logAfterInterceptor(target, args, result, throwable);
        }

        prepareAfterTrace(target, args, result, throwable);

        if (block == null) {
            return;
        }

        final Trace trace = block.getTrace();
        if (trace == null) {
            return;
        }

        try (TraceBlock traceBlock = block) {
            if (traceBlock.isBegin()) {
                afterTrace(trace, traceBlock, target, args, result, throwable);
                doInAfterTrace(traceBlock, target, args, result, throwable);
            }
        } catch (Throwable th) {
            if (logger.isWarnEnabled()) {
                logger.warn("AFTER error. Caused:{}", th.getMessage(), th);
            }
        }
    }

    protected void prepareAfterTrace(Object target, Object[] args, Object result, Throwable throwable) {
    }

    protected void afterTrace(final Trace trace, final SpanEventRecorder recorder, final Object target, final Object[] args, final Object result, final Throwable throwable) {
    }

    protected abstract void doInAfterTrace(final SpanEventRecorder recorder, final Object target, final Object[] args, final Object result, Throwable throwable) throws Exception;

    protected MethodDescriptor getMethodDescriptor() {
        return methodDescriptor;
    }
}