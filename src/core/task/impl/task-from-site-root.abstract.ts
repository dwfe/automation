import {TaskAbstract} from '../task.abstract';
import {Command, TCommand} from '../../cmd';
import {Env} from '../../env';

const {goto} = Command;

/**
 * A task that starts with going to the root of the site
 */
export abstract class TaskFromSiteRootAbstract extends TaskAbstract {

  delayForPageRendering = 60

  constructor(id: any,
              protected env: Env) {
    super(id);
  }

  getScript = (): TCommand[] => [
    goto('/'),
    ...this.commands,
  ];

  abstract get commands(): TCommand[];

}

