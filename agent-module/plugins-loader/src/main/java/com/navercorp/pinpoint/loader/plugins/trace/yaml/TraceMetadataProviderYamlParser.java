/*
 * Copyright 2019 NAVER Corp.
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

package com.navercorp.pinpoint.loader.plugins.trace.yaml;

import com.fasterxml.jackson.core.JsonParseException;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.dataformat.yaml.YAMLFactory;
import com.navercorp.pinpoint.common.trace.AnnotationKey;
import com.navercorp.pinpoint.common.trace.ParsedTraceMetadataProvider;
import com.navercorp.pinpoint.common.trace.ServiceTypeInfo;
import com.navercorp.pinpoint.common.util.CollectionUtils;
import com.navercorp.pinpoint.loader.plugins.trace.TraceMetadataProviderParser;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.net.JarURLConnection;
import java.net.URL;
import java.net.URLConnection;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * @author HyunGil Jeong
 */
public class TraceMetadataProviderYamlParser implements TraceMetadataProviderParser {

    private final Logger logger = LogManager.getLogger(this.getClass());
    private final ObjectMapper mapper = new ObjectMapper(new YAMLFactory());

    @Override
    public ParsedTraceMetadataProvider parse(URL url) {
        String typeProviderId = getTypeProviderId(url);
        try {
            ParsedTraceMetadata parsedTraceMetadata = parse0(url);
            try {List<ServiceTypeInfo> serviceTypeInfos = toServiceTypeInfos(parsedTraceMetadata.getServiceTypes());
                List<AnnotationKey> annotationKeys = toAnnotationKeys(parsedTraceMetadata.getAnnotationKeys());
                return new ParsedTraceMetadataProvider(typeProviderId, serviceTypeInfos, annotationKeys);
            } catch (Exception e) {
                throw new IllegalStateException("Invalid type provider definition : " + url.toString(), e);
            }
        } catch (IOException e) {
            throw new IllegalStateException("IOException parsing " + url.toExternalForm(), e);
        }
    }

    private ParsedTraceMetadata parse0(URL metaUrl) throws IOException {
        try (InputStream inputStream = metaUrl.openStream()) {
            ParsedTraceMetadata parsedTraceMetadata = mapper.readValue(inputStream, ParsedTraceMetadata.class);
            if (parsedTraceMetadata == null) {
                logger.warn("Empty type provider definition. Skipping : {}", metaUrl.toExternalForm());
            }
            return parsedTraceMetadata;
        } catch (JsonParseException | JsonMappingException e) {
            throw new IllegalStateException("Error parsing yml : " + metaUrl, e);
        } catch (IOException e) {
            throw new IllegalStateException("Error opening stream : " + metaUrl, e);
        }
    }

    private String getTypeProviderId(URL metaUrl) {
        try {
            URLConnection urlConnection = metaUrl.openConnection();
            if (urlConnection instanceof JarURLConnection) {
                JarURLConnection jarUrlConnection = (JarURLConnection) urlConnection;
                String jarFileName = new File(jarUrlConnection.getJarFile().getName()).getName();
                String entryFileName = new File(jarUrlConnection.getEntryName()).getName();
                return jarFileName + ":" + entryFileName;
            }
        } catch (IOException e) {
            logger.warn("Error opening : " + metaUrl, e);
            return metaUrl.toExternalForm();
        }
        return metaUrl.toExternalForm();
    }

    private List<ServiceTypeInfo> toServiceTypeInfos(List<ParsedServiceType> parsedServiceTypes) {
        if (CollectionUtils.isEmpty(parsedServiceTypes)) {
            return Collections.emptyList();
        }
        List<ServiceTypeInfo> serviceTypeInfos = new ArrayList<>(parsedServiceTypes.size());
        for (ParsedServiceType parsedServiceType : parsedServiceTypes) {
            serviceTypeInfos.add(parsedServiceType.toServiceTypeInfo());
        }
        return serviceTypeInfos;
    }

    private List<AnnotationKey> toAnnotationKeys(List<ParsedAnnotationKey> parsedAnnotationKeys) {
        if (CollectionUtils.isEmpty(parsedAnnotationKeys)) {
            return Collections.emptyList();
        }
        List<AnnotationKey> annotationKeys = new ArrayList<>(parsedAnnotationKeys.size());
        for (ParsedAnnotationKey parsedAnnotationKey : parsedAnnotationKeys) {
            annotationKeys.add(parsedAnnotationKey.toAnnotationKey());
        }
        return annotationKeys;
    }
}
