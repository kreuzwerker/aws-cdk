import * as events from '@aws-cdk/aws-events';
// import * as iam from '@aws-cdk/aws-iam';
import * as ssm from '@aws-cdk/aws-ssm';
import { Fn } from '@aws-cdk/core';
// import * as cdk from '@aws-cdk/aws-cloudformation';
import { addToDeadLetterQueueResourcePolicy, TargetBaseProps, bindBaseTargetConfig } from './util';

/**
 * Customize the SSM Document Event Target
 */
export interface CfnDocumentProps extends TargetBaseProps {
  /**
   * The message to send to the document
   *
   * @default the entire EventBridge event
   */
  readonly message?: events.RuleTargetInput;
}

/**
 * Use an SSM Document as a target for Amazon EventBridge rules.
 *
 * @example
 *   /// fixture=withRepoAndTopic
 *   // publish to an SSM Document every time code is committed
 *   // to a CodeCommit repository
 *   repository.onCommit('onCommit', { target: new targets.SSMDocument(document) });
 *
 */
export class CfnDocument implements events.IRuleTarget {
  constructor(public readonly document: ssm.CfnDocument, private readonly props: CfnDocumentProps = {}) {
  }

  /**
   * Returns a RuleTarget that can be used to trigger this SSM Document as a
   * result from an EventBridge event.
   *
   * @see https://docs.aws.amazon.com/cdk/api/v1/docs/aws-events-targets-readme.html
   */
  public bind(_rule: events.IRule, _id?: string): events.RuleTargetConfig {
    // deduplicated automatically
    // this.document.grantPublish(new iam.ServicePrincipal('events.amazonaws.com'));

    if (this.props.deadLetterQueue) {
      addToDeadLetterQueueResourcePolicy(_rule, this.props.deadLetterQueue);
    }

    return {
      ...bindBaseTargetConfig(this.props),
      // arn: this.document.topicArn,
      arn: Fn.getAtt(this.document.logicalId, 'arn').toString(),
      input: this.props.message,
      targetResource: this.document,
    };
  }
}
