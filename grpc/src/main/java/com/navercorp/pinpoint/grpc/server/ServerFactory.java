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

package com.navercorp.pinpoint.grpc.server;

import com.google.common.util.concurrent.MoreExecutors;
import com.navercorp.pinpoint.common.profiler.concurrent.PinpointThreadFactory;
import com.navercorp.pinpoint.common.util.CpuUtils;
import com.navercorp.pinpoint.grpc.channelz.ChannelzRegistry;
import io.grpc.InternalWithLogId;
import io.grpc.Server;
import io.grpc.ServerCallExecutorSupplier;
import io.grpc.ServerInterceptor;
import io.grpc.ServerServiceDefinition;
import io.grpc.ServerTransportFilter;
import io.grpc.netty.NettyServerBuilder;
import io.netty.buffer.ByteBufAllocator;
import io.netty.channel.ChannelOption;
import io.netty.channel.EventLoopGroup;
import io.netty.channel.ServerChannel;
import io.netty.channel.WriteBufferWaterMark;
import io.netty.handler.ssl.SslContext;
import io.netty.util.concurrent.Future;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import javax.net.ssl.SSLException;
import java.io.Closeable;
import java.net.InetSocketAddress;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.concurrent.Executor;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.ThreadFactory;
import java.util.concurrent.TimeUnit;

/**
 * @author Woonduk Kang(emeroad)
 */
public class ServerFactory implements Closeable {
    private final Logger logger = LogManager.getLogger(this.getClass());

    private final String name;

    private final String hostname;
    private final int port;

    private final Class<? extends ServerChannel> channelType;
    private final ExecutorService bossExecutor;
    private final EventLoopGroup bossEventLoopGroup;

    private final ExecutorService workerExecutor;
    private final EventLoopGroup workerEventLoopGroup;

    private final Executor serverExecutor;
    private final ServerCallExecutorSupplier callExecutor;

    private final List<ServerServiceDefinition> bindableServices = new ArrayList<>();
    private final List<ServerTransportFilter> serverTransportFilters = new ArrayList<>();
    private final List<ServerInterceptor> serverInterceptors = new ArrayList<>();

    private final ServerOption serverOption;
    private final ByteBufAllocator byteBufAllocator;
    private final SslContext sslContext;
    private ChannelzRegistry channelzRegistry;

    public ServerFactory(String name, String hostname, int port,
                         Executor serverExecutor,
                         ServerCallExecutorSupplier callExecutor,
                         ServerOption serverOption,
                         ByteBufAllocator byteBufAllocator) {
        this(name, hostname, port, serverExecutor, callExecutor, serverOption, byteBufAllocator, null);
    }

    public ServerFactory(String name, String hostname, int port,
                         Executor serverExecutor,
                         ServerCallExecutorSupplier callExecutor,
                         ServerOption serverOption,
                         ByteBufAllocator byteBufAllocator,
                         SslContext sslContext) {
        this.name = Objects.requireNonNull(name, "name");
        this.hostname = Objects.requireNonNull(hostname, "hostname");
        this.serverOption = Objects.requireNonNull(serverOption, "serverOption");
        this.byteBufAllocator = Objects.requireNonNull(byteBufAllocator, "byteBufAllocator");

        this.port = port;

        final ServerChannelType serverChannelType = getChannelType();
        this.channelType = serverChannelType.getChannelType();

        this.bossExecutor = newExecutor(name + "-Channel-Boss");
        this.bossEventLoopGroup = serverChannelType.newEventLoopGroup(1, this.bossExecutor);
        this.workerExecutor = newExecutor(name + "-Channel-Worker");
        this.workerEventLoopGroup = serverChannelType.newEventLoopGroup(CpuUtils.cpuCount(), workerExecutor);

        this.serverExecutor = Objects.requireNonNull(serverExecutor, "serverExecutor");
        this.callExecutor = callExecutor;

        this.sslContext = sslContext;
    }

    private ServerChannelType getChannelType() {
        final ServerChannelTypeFactory factory = new ServerChannelTypeFactory();
        return factory.newChannelType(serverOption.getChannelTypeEnum());
    }


    private ExecutorService newExecutor(String name) {
        ThreadFactory threadFactory = new PinpointThreadFactory(PinpointThreadFactory.DEFAULT_THREAD_NAME_PREFIX + name, true);
        return Executors.newCachedThreadPool(threadFactory);
    }

    public void setChannelzRegistry(ChannelzRegistry channelzRegistry) {
        this.channelzRegistry = Objects.requireNonNull(channelzRegistry, "channelzRegistry");
    }

    public void addService(ServerServiceDefinition serverServiceDefinition) {
        Objects.requireNonNull(serverServiceDefinition, "serverServiceDefinition");
        this.bindableServices.add(serverServiceDefinition);
    }

    public void addTransportFilter(ServerTransportFilter serverTransportFilter) {
        Objects.requireNonNull(serverTransportFilter, "serverTransportFilter");
        this.serverTransportFilters.add(serverTransportFilter);
    }

    public void addInterceptor(ServerInterceptor serverInterceptor) {
        Objects.requireNonNull(serverInterceptor, "serverInterceptor");
        this.serverInterceptors.add(serverInterceptor);
    }

    public Server build() throws SSLException, NoSuchFieldException, IllegalAccessException {
        InetSocketAddress bindAddress = new InetSocketAddress(this.hostname, this.port);
        NettyServerBuilder serverBuilder = NettyServerBuilder.forAddress(bindAddress);

        logger.info("ChannelType:{}", channelType.getSimpleName());
        serverBuilder.channelType(channelType);
        serverBuilder.bossEventLoopGroup(bossEventLoopGroup);
        serverBuilder.workerEventLoopGroup(workerEventLoopGroup);

        NettyStatsOptions.disableStats(serverBuilder);

        for (ServerServiceDefinition service : this.bindableServices) {
            logger.info("Add ServerServiceDefinition={}, server={}", service.getServiceDescriptor(), name);
            serverBuilder.addService(service);
        }

        for (ServerTransportFilter transportFilter : this.serverTransportFilters) {
            logger.info("Add ServerTransportFilter={}, server={}", transportFilter, name);
            serverBuilder.addTransportFilter(transportFilter);
        }
        for (ServerInterceptor serverInterceptor : this.serverInterceptors) {
            logger.info("Add ServerInterceptor={}, server={}", serverInterceptor, name);
            serverBuilder.intercept(serverInterceptor);
        }

        serverBuilder.executor(this.serverExecutor);

        if (this.callExecutor != null) {
            serverBuilder.callExecutor(this.callExecutor);
        }

        setupServerOption(serverBuilder);

        if (sslContext != null) {
            serverBuilder.sslContext(sslContext);
        }

        Server server = serverBuilder.build();
        if (server instanceof InternalWithLogId) {
            final InternalWithLogId logId = (InternalWithLogId) server;
            final long serverLogId = logId.getLogId().getId();
            logger.info("{} serverLogId:{}", name, serverLogId);
            if (channelzRegistry != null) {
                channelzRegistry.register(serverLogId, name);
            }
        }
        return server;
    }


    private void setupServerOption(NettyServerBuilder builder) {
        // TODO @see PinpointServerAcceptor
        builder.withChildOption(ChannelOption.TCP_NODELAY, true);
        builder.withChildOption(ChannelOption.SO_REUSEADDR, true);
        builder.withChildOption(ChannelOption.SO_RCVBUF, this.serverOption.getReceiveBufferSize());
        final WriteBufferWaterMark disabledWriteBufferWaterMark = new WriteBufferWaterMark(0, Integer.MAX_VALUE);
        builder.withChildOption(ChannelOption.WRITE_BUFFER_WATER_MARK, disabledWriteBufferWaterMark);
        builder.withChildOption(ChannelOption.ALLOCATOR, this.byteBufAllocator);

        builder.handshakeTimeout(this.serverOption.getHandshakeTimeout(), TimeUnit.MILLISECONDS);
        builder.flowControlWindow(this.serverOption.getFlowControlWindow());

        builder.maxInboundMessageSize(this.serverOption.getMaxInboundMessageSize());
        builder.maxInboundMetadataSize(this.serverOption.getMaxHeaderListSize());

        builder.keepAliveTime(this.serverOption.getKeepAliveTime(), TimeUnit.MILLISECONDS);
        builder.keepAliveTimeout(this.serverOption.getKeepAliveTimeout(), TimeUnit.MILLISECONDS);
        builder.permitKeepAliveTime(this.serverOption.getPermitKeepAliveTime(), TimeUnit.MILLISECONDS);
        builder.permitKeepAliveWithoutCalls(this.serverOption.isPermitKeepAliveWithoutCalls());

        builder.maxConnectionIdle(this.serverOption.getMaxConnectionIdle(), TimeUnit.MILLISECONDS);
        builder.maxConnectionAge(this.serverOption.getMaxConnectionAge(), TimeUnit.MILLISECONDS);
        builder.maxConnectionAgeGrace(this.serverOption.getMaxConnectionAgeGrace(), TimeUnit.MILLISECONDS);
        builder.maxConcurrentCallsPerConnection(this.serverOption.getMaxConcurrentCallsPerConnection());
        if (logger.isInfoEnabled()) {
            logger.info("Set serverOption {}. name={}, hostname={}, port={}", serverOption, name, hostname, port);
        }
    }

    @Override
    public void close() {
        final Future<?> workerShutdown = this.workerEventLoopGroup.shutdownGracefully();
        workerShutdown.awaitUninterruptibly();
        if (!MoreExecutors.shutdownAndAwaitTermination(workerExecutor, Duration.ofSeconds(3))) {
            logger.warn("{}-Channel-Worker shutdown failed", name);
        }

        final Future<?> bossShutdown = this.bossEventLoopGroup.shutdownGracefully();
        bossShutdown.awaitUninterruptibly();
        if (!MoreExecutors.shutdownAndAwaitTermination(bossExecutor, Duration.ofSeconds(3))) {
            logger.warn("{}-Channel-Boss shutdown failed", name);
        }
    }

    @Override
    public String toString() {
        return "ServerFactory{" +
                "name='" + name + '\'' +
                ", hostname='" + hostname + '\'' +
                ", port=" + port +
                '}';
    }
}