#!/bin/bash
cd /home/kavia/workspace/code-generation/kavia-ai-overview-and-insights-166261-166271/what_is_kavia_ai_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

