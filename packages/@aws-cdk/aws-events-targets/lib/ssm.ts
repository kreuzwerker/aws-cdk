import * as events from '@aws-cdk/aws-events';
import * as iam from '@aws-cdk/aws-iam';
import * as ssm from '@aws-cdk/aws-ssm';
import { addToDeadLetterQueueResourcePolicy, TargetBaseProps, bindBaseTargetConfig } from './util';

/**
 * Customize the SNS Topic Event Target
 */
export interface SSMDocumentProps extends TargetBaseProps {
  /**
   * The message to send to the topic
   *
   * @default the entire EventBridge event
   */
  readonly message?: events.RuleTargetInput;
}

/**
 * Use an SNS topic as a target for Amazon EventBridge rules.
 *
 * @example
 *   /// fixture=withRepoAndTopic
 *   // publish to an SNS topic every time code is committed
 *   // to a CodeCommit repository
 *   repository.onCommit('onCommit', { target: new targets.SnsTopic(topic) });
 *
 */
export class SSMDocument implements events.IRuleTarget {
  constructor(public readonly topic: ssm.ITopic, private readonly props: SSMDocumentProps = {}) {
  }

  /**
   * Returns a RuleTarget that can be used to trigger this SNS topic as a
   * result from an EventBridge event.
   *
   * @see https://docs.aws.amazon.com/eventbridge/latest/userguide/resource-based-policies-eventbridge.html#sns-permissions
   */
  public bind(_rule: events.IRule, _id?: string): events.RuleTargetConfig {
    // deduplicated automatically
    this.topic.grantPublish(new iam.ServicePrincipal('events.amazonaws.com'));

    if (this.props.deadLetterQueue) {
      addToDeadLetterQueueResourcePolicy(_rule, this.props.deadLetterQueue);
    }

    return {
      ...bindBaseTargetConfig(this.props),
      arn: this.topic.topicArn,
      input: this.props.message,
      targetResource: this.topic,
    };
  }
}
