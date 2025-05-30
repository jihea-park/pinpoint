package com.navercorp.pinpoint.web.webhook.dao;

import com.navercorp.pinpoint.web.webhook.model.Webhook;

import java.util.List;

public interface WebhookDao {

    String insertWebhook(Webhook webhook);

    void deleteWebhook(Webhook webhook);

    void updateWebhook(Webhook webhook);

    void deleteWebhookByApplicationName(String applicationName);

    void deleteWebhookByServiceName(String serviceName);

    List<Webhook> selectWebhookByApplicationName(String applicationName);

    List<Webhook> selectWebhookByServiceName(String serviceName);

    List<Webhook> selectWebhookByRuleId(String ruleId);

    List<Webhook> selectWebhookByPinotAlarmRuleId(String ruleId);

    Webhook selectWebhook(String webhookId);
}
