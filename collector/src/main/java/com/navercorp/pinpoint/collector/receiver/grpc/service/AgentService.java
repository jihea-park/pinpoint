/*
 * Copyright 2025 NAVER Corp.
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

package com.navercorp.pinpoint.collector.receiver.grpc.service;

import com.navercorp.pinpoint.collector.grpc.lifecycle.PingEventHandler;
import com.navercorp.pinpoint.collector.grpc.lifecycle.PingSession;
import com.navercorp.pinpoint.collector.handler.RequestResponseHandler;
import com.navercorp.pinpoint.common.profiler.logging.ThrottledLogger;
import com.navercorp.pinpoint.grpc.Header;
import com.navercorp.pinpoint.grpc.MessageFormatUtils;
import com.navercorp.pinpoint.grpc.server.ServerContext;
import com.navercorp.pinpoint.grpc.server.TransportMetadata;
import com.navercorp.pinpoint.grpc.trace.AgentGrpc;
import com.navercorp.pinpoint.grpc.trace.PAgentInfo;
import com.navercorp.pinpoint.grpc.trace.PPing;
import com.navercorp.pinpoint.grpc.trace.PResult;
import com.navercorp.pinpoint.io.util.MessageType;
import com.navercorp.pinpoint.io.util.MessageTypes;
import io.grpc.Context;
import io.grpc.Metadata;
import io.grpc.Status;
import io.grpc.stub.ServerCallStreamObserver;
import io.grpc.stub.StreamObserver;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import java.util.Objects;
import java.util.concurrent.Executor;
import java.util.concurrent.RejectedExecutionException;

/**
 * @author jaehong.kim
 */
public class AgentService extends AgentGrpc.AgentImplBase {

    private final Logger logger = LogManager.getLogger(this.getClass());

    private final RequestResponseHandler<PAgentInfo, PResult> handler;

    private final PingEventHandler pingEventHandler;

    private final JobRunner jobRunner;
    private final Executor executor;

    public AgentService(RequestResponseHandler<PAgentInfo, PResult> handler,
                        PingEventHandler pingEventHandler,
                        Executor executor,
                        ServerRequestFactory requestFactory,
                        ServerResponseFactory responseFactory) {
        this.handler = Objects.requireNonNull(handler, "handler");

        this.pingEventHandler = Objects.requireNonNull(pingEventHandler, "pingEventHandler");
        Objects.requireNonNull(executor, "executor");
        this.jobRunner = new JobRunner(logger, requestFactory, responseFactory);
        this.executor = Context.currentContextExecutor(executor);
    }

    @Override
    public void requestAgentInfo(PAgentInfo agentInfo, StreamObserver<PResult> responseObserver) {
        if (logger.isDebugEnabled()) {
            logger.debug("Request PAgentInfo={}", MessageFormatUtils.debugLog(agentInfo));
        }

        final MessageType messageType = MessageTypes.AGENT_INFO;
        doExecute(new Runnable() {
            @Override
            public void run() {
                jobRunner.execute(messageType, agentInfo, responseObserver, handler::handleRequest);

                // Update service type of PingSession
                TransportMetadata transportMetadata = ServerContext.getTransportMetadata();
                pingEventHandler.update(transportMetadata.getTransportId());
            }
        }, messageType);
    }

    void doExecute(Runnable runnable, MessageType messageType) {
        try {
            executor.execute(runnable);
        } catch (RejectedExecutionException ree) {
            final Header header = ServerContext.getAgentInfo();
            // Defense code
            logger.warn("Failed to request. Rejected execution, {} {} executor={}", messageType, header, executor);
        }
    }

    @Override
    public StreamObserver<PPing> pingSession(final StreamObserver<PPing> response) {
        Context context = Context.current();
        Header header = ServerContext.getAgentInfo(context);
        TransportMetadata transport = ServerContext.getTransportMetadata(context);
        PingSession pingSession = this.pingEventHandler.newPingSession(transport.getTransportId(), header);

        final ServerCallStreamObserver<PPing> responseObserver = (ServerCallStreamObserver<PPing>) response;
        return new StreamObserver<>() {
            private final ThrottledLogger thLogger = ThrottledLogger.getLogger(AgentService.this.logger, 100);

            @Override
            public void onNext(PPing ping) {
                AgentService.this.pingEventHandler.ping(pingSession);
                if (logger.isDebugEnabled()) {
                    thLogger.debug("PingSession:{} onNext:PPing", pingSession);
                }
                if (responseObserver.isReady()) {
                    PPing replay = newPing();
                    responseObserver.onNext(replay);
                } else {
                    thLogger.warn("ping message is ignored: stream is not ready: {}", pingSession.getHeader());
                }
            }

            private PPing newPing() {
                return PPing.getDefaultInstance();
            }

            @Override
            public void onError(Throwable t) {
                final Status status = Status.fromThrowable(t);
                final Metadata metadata = Status.trailersFromThrowable(t);
                if (thLogger.isInfoEnabled()) {
                    thLogger.info("Failed to ping stream, transportId={}, header={}, status={}, metadata={}", pingSession.getTransportId(), header, status, metadata);
                }
                // responseObserver.onCompleted();
                disconnect(pingSession);
            }

            @Override
            public void onCompleted() {
                if (logger.isDebugEnabled()) {
                    thLogger.debug("PingSession:{} onCompleted()", pingSession);
                }
                responseObserver.onCompleted();
                disconnect(pingSession);
            }

            private void disconnect(PingSession pingSession) {
                AgentService.this.pingEventHandler.close(pingSession);
            }

        };
    }

}