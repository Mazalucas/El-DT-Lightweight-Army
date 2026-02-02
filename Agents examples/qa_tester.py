"""QA Tester agent - Testing specialist."""

from typing import Any, Dict, List, Optional

from agents_army.core.agent import Agent, AgentConfig, LLMProvider
from agents_army.protocol.message import AgentMessage
from agents_army.protocol.types import AgentRole, MessageType


class QATester(Agent):
    """
    QA Tester agent - Specialized in quality assurance and testing.

    Department: Testing
    """

    def __init__(
        self,
        name: str = "QA Tester",
        instructions: Optional[str] = None,
        model: str = "gpt-4",
        llm_provider: Optional[LLMProvider] = None,
    ):
        """
        Initialize QA Tester agent.

        Args:
            name: Agent name
            instructions: Custom instructions
            model: LLM model to use
            llm_provider: Optional LLM provider
        """
        default_instructions = (
            "You are a QA tester. Your goal is to ensure quality by creating "
            "comprehensive test plans, identifying bugs, and validating functionality. "
            "Always be thorough and detail-oriented."
        )

        config = AgentConfig(
            name=name,
            role=AgentRole.QA_TESTER,
            goal="Ensure quality through comprehensive testing",
            backstory=(
                "You are an experienced QA tester with a keen eye for detail. "
                "You excel at finding bugs, creating test cases, and ensuring "
                "software quality meets high standards."
            ),
            instructions=instructions or default_instructions,
            model=model,
            allow_delegation=False,
            max_iterations=3,
            department="Testing",
        )

        super().__init__(config, llm_provider)

    async def create_test_plan(self, feature_spec: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a test plan for a feature.

        Args:
            feature_spec: Feature specification

        Returns:
            Test plan
        """
        prompt = f"""Create a comprehensive test plan for this feature:

{feature_spec}

Provide:
1. Test scenarios
2. Test cases
3. Edge cases
4. Regression tests
5. Performance tests (if applicable)
"""

        test_plan = await self.generate_response(prompt)

        return {
            "feature": feature_spec,
            "test_plan": test_plan,
            "test_cases": [],
            "scenarios": [],
        }

    async def validate_output(
        self, output: Any, expected: Any, criteria: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Validate an output against expected results.

        Args:
            output: Actual output
            expected: Expected output
            criteria: Optional validation criteria

        Returns:
            Validation results
        """
        prompt = f"""Validate this output:

Actual Output: {output}
Expected Output: {expected}
"""

        if criteria:
            prompt += f"\nValidation Criteria: {criteria}"

        prompt += "\n\nProvide:\n1. Pass/Fail status\n2. Issues found\n3. Recommendations"

        validation = await self.generate_response(prompt)

        # Simple pass/fail check
        passed = str(output) == str(expected) if expected else True

        return {
            "output": output,
            "expected": expected,
            "passed": passed,
            "validation": validation,
            "issues": [],
        }

    async def report_bug(self, bug_info: Dict[str, Any]) -> Dict[str, Any]:
        """
        Report a bug with details.

        Args:
            bug_info: Bug information

        Returns:
            Bug report
        """
        prompt = f"""Create a detailed bug report:

Bug Information:
{bug_info}

Provide:
1. Bug description
2. Steps to reproduce
3. Expected vs actual behavior
4. Severity assessment
5. Suggested fix
"""

        bug_report = await self.generate_response(prompt)

        return {
            "bug_info": bug_info,
            "report": bug_report,
            "severity": "medium",  # Would be determined by analysis
        }

    async def _process_message(self, message: AgentMessage) -> Optional[AgentMessage]:
        """
        Process incoming message.

        Args:
            message: Incoming message

        Returns:
            Optional response message
        """
        if message.type == MessageType.TASK_REQUEST:
            payload = message.payload

            if "feature_spec" in payload:
                # Test plan creation task
                feature_spec = payload["feature_spec"]

                test_plan = await self.create_test_plan(feature_spec)

                return AgentMessage(
                    from_role=self.role,
                    to_role=message.from_role,
                    type=MessageType.TASK_RESPONSE,
                    payload={
                        "task_id": payload.get("task_id"),
                        "status": "completed",
                        "result": test_plan,
                    },
                    reply_to=message.id,
                )

            elif "output" in payload and "expected" in payload:
                # Validation task
                output = payload["output"]
                expected = payload["expected"]
                criteria = payload.get("criteria")

                validation = await self.validate_output(output, expected, criteria)

                return AgentMessage(
                    from_role=self.role,
                    to_role=message.from_role,
                    type=MessageType.TASK_RESPONSE,
                    payload={
                        "task_id": payload.get("task_id"),
                        "status": "completed",
                        "result": validation,
                    },
                    reply_to=message.id,
                )

            elif "bug_info" in payload:
                # Bug reporting task
                bug_info = payload["bug_info"]

                bug_report = await self.report_bug(bug_info)

                return AgentMessage(
                    from_role=self.role,
                    to_role=message.from_role,
                    type=MessageType.TASK_RESPONSE,
                    payload={
                        "task_id": payload.get("task_id"),
                        "status": "completed",
                        "result": bug_report,
                    },
                    reply_to=message.id,
                )

        return None
