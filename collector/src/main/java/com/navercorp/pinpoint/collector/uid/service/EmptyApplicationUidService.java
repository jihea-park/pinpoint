package com.navercorp.pinpoint.collector.uid.service;

import com.navercorp.pinpoint.common.server.uid.ApplicationUid;
import com.navercorp.pinpoint.common.server.uid.ServiceUid;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

@Service
@ConditionalOnProperty(value = "pinpoint.collector.application.uid.enable", havingValue = "false", matchIfMissing = true)
public class EmptyApplicationUidService implements ApplicationUidService {
    private final Logger logger = LogManager.getLogger(this.getClass());

    public EmptyApplicationUidService() {
        logger.info("EmptyApplicationUidService initialized");
    }

    @Override
    public ApplicationUid getApplicationUid(ServiceUid serviceUid, String applicationName) {
        return null;
    }

    @Override
    public ApplicationUid getOrCreateApplicationUid(ServiceUid serviceUid, String applicationName) {
        return null;
    }
}
