#!/bin/bash
cd /home/kavia/workspace/code-generation/travel-planner-pro-281204-281215/travel_planner_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

