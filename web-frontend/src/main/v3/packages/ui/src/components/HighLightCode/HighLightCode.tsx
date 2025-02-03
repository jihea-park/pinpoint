import 'highlight.js/styles/atom-one-light.min.css';
import React from 'react';
import hljs from 'highlight.js/lib/core';
import typescript from 'highlight.js/lib/languages/typescript';
import sql from 'highlight.js/lib/languages/sql';
import java from 'highlight.js/lib/languages/java';
import plaintext from 'highlight.js/lib/languages/plaintext';
import { cn } from '../../lib';

// 언어 등록
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('sql', sql);
hljs.registerLanguage('java', java);
hljs.registerLanguage('plaintext', plaintext);

export interface HighLightCodeProps {
  language?: 'typescript' | 'sql' | 'java' | 'plaintext';
  code?: string;
  className?: string;
}

export const HighLightCode = ({
  language = 'plaintext',
  code = '',
  className,
}: HighLightCodeProps) => {
  const [highLightedCode, setHighLightedCode] = React.useState(code || '');

  React.useEffect(() => {
    try {
      // 언어가 정상적으로 등록되었는지 확인
      if (!hljs.getLanguage(language)) {
        console.warn(`Highlight.js: '${language}' 언어가 등록되지 않았습니다.`);
        setHighLightedCode(code || '');
        return;
      }

      const result = hljs.highlight(code || '', { language, ignoreIllegals: true });
      setHighLightedCode(result.value);
    } catch (error) {
      console.error(`Highlight.js 오류:`, error);
      setHighLightedCode(code || ''); // 오류 발생 시 원본 코드 출력
    }
  }, [code, language]);

  return (
    <div className={cn('hljs', className)}>
      {highLightedCode.split('\n').map((str, i) => (
        <React.Fragment key={i}>
          <code dangerouslySetInnerHTML={{ __html: str }} className="break-all"></code>
          <br />
        </React.Fragment>
      ))}
    </div>
  );
};
