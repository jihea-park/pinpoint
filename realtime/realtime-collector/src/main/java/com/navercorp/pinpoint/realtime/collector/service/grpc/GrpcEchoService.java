/*
 * Copyright 2023 NAVER Corp.
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
package com.navercorp.pinpoint.realtime.collector.service.grpc;

import com.navercorp.pinpoint.channel.service.server.IgnoreDemandException;
import com.navercorp.pinpoint.grpc.trace.PCmdEcho;
import com.navercorp.pinpoint.grpc.trace.PCmdEchoResponse;
import com.navercorp.pinpoint.grpc.trace.PCmdRequest;
import com.navercorp.pinpoint.realtime.collector.receiver.grpc.GrpcAgentConnection;
import com.navercorp.pinpoint.realtime.collector.receiver.grpc.GrpcAgentConnectionRepository;
import com.navercorp.pinpoint.realtime.collector.service.EchoService;
import com.navercorp.pinpoint.realtime.collector.sink.EchoPublisher;
import com.navercorp.pinpoint.realtime.collector.sink.SinkRepository;
import com.navercorp.pinpoint.realtime.dto.CommandType;
import com.navercorp.pinpoint.realtime.dto.Echo;
import reactor.core.publisher.Mono;

import java.util.Objects;

/**
 * @author youngjin.kim2
 */
class GrpcEchoService implements EchoService {

    private final GrpcAgentConnectionRepository connectionRepository;
    private final SinkRepository<EchoPublisher> sinkRepository;

    GrpcEchoService(
            GrpcAgentConnectionRepository connectionRepository,
            SinkRepository<EchoPublisher> sinkRepository
    ) {
        this.connectionRepository = Objects.requireNonNull(connectionRepository, "connectionRepository");
        this.sinkRepository = Objects.requireNonNull(sinkRepository, "sinkRepository");
    }

    @Override
    public Mono<Echo> echo(Echo echo) {
        return Mono.<PCmdEchoResponse>create(sink -> {
            GrpcAgentConnection conn = this.connectionRepository.getConnection(echo.getAgentKey());
            if (conn == null) {
                sink.error(new IgnoreDemandException("Connection not found"));
                return;
            }
            if (!conn.getSupportCommandList().contains(CommandType.ECHO)) {
                sink.error(new RuntimeException("Command not supported"));
                return;
            }

            final long sinkId = this.sinkRepository.put(new EchoPublisher(sink));
            sink.onDispose(() -> this.sinkRepository.invalidate(sinkId));
            conn.request(PCmdRequest.newBuilder()
                    .setRequestId(Long.valueOf(sinkId).intValue())
                    .setCommandEcho(PCmdEcho.newBuilder()
                            .setMessage(echo.getMessage()))
                    .build());
        }).map(el -> new Echo(echo.getId(), echo.getAgentKey(), el.getMessage()));
    }

}
