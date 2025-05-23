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

import com.navercorp.pinpoint.common.trace.ServiceType;
import com.navercorp.pinpoint.grpc.Header;
import com.navercorp.pinpoint.grpc.HeaderReader;
import io.grpc.Metadata;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

/**
 * @author Woonduk Kang(emeroad)
 */
public class ServerHeaderReaderTest {

    private static final String AGENT_ID = "agentId";
    private static final String AGENT_NAME = "agentName";
    private static final String APPLICATION_NAME = "applicationName";
    private static final long AGENT_START_TIME = System.currentTimeMillis();
    private static final long SOCKET_ID = 1001;
    private static final int SERVICE_TYPE = ServiceType.STAND_ALONE.getCode();

    private final HeaderReader<Header> reader = new ServerHeaderReaderFactory("test");

    @Test
    public void extract() {
        Metadata metadata = newMetadata();
        Header header = reader.extract(metadata);

        Assertions.assertEquals(AGENT_ID, header.getAgentId());
        Assertions.assertEquals(AGENT_NAME, header.getAgentName());
        Assertions.assertEquals(APPLICATION_NAME, header.getApplicationName());
        Assertions.assertEquals(AGENT_START_TIME, header.getAgentStartTime());
        Assertions.assertEquals(SOCKET_ID, header.getSocketId());
        Assertions.assertEquals(SERVICE_TYPE, header.getServiceType());
    }

    @Test
    public void extract_fail_agentId() {
        Assertions.assertThrows(InvalidGrpcHeaderException.class, () -> {
            Metadata metadata = newMetadata();
            metadata.put(Header.AGENT_ID_KEY, "!!agentId");
            reader.extract(metadata);
        });
    }

    @Test
    public void extract_fail_agentName() {
        Assertions.assertThrows(InvalidGrpcHeaderException.class, () -> {
            Metadata metadata = newMetadata();
            metadata.put(Header.AGENT_NAME_KEY, "!!agentName");
            reader.extract(metadata);
        });
    }

    @Test
    public void extract_no_agentName() {
        Metadata metadata = newMetadata();
        metadata.remove(Header.AGENT_NAME_KEY, AGENT_NAME);
        final Header header = reader.extract(metadata);
        Assertions.assertEquals(AGENT_ID, header.getAgentName());
    }

    @Test
    public void extract_fail_applicationName() {
        Assertions.assertThrows(InvalidGrpcHeaderException.class, () -> {
            Metadata metadata = newMetadata();
            metadata.put(Header.APPLICATION_NAME_KEY, "!!applicationName");
            reader.extract(metadata);
        });
    }

    private Metadata newMetadata() {
        Metadata metadata = new Metadata();
        metadata.put(Header.AGENT_ID_KEY, AGENT_ID);
        metadata.put(Header.AGENT_NAME_KEY, AGENT_NAME);
        metadata.put(Header.APPLICATION_NAME_KEY, APPLICATION_NAME);
        metadata.put(Header.AGENT_START_TIME_KEY, Long.toString(AGENT_START_TIME));
        metadata.put(Header.SOCKET_ID, Long.toString(SOCKET_ID));
        metadata.put(Header.SERVICE_TYPE_KEY, Integer.toString(SERVICE_TYPE));
        return metadata;
    }
}