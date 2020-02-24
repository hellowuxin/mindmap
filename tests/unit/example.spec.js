import { expect } from 'chai'
import { mount } from '@vue/test-utils'
import mindmap from '@/components/MindMap.vue'
import dataLearn from '../../public/learn.json'

describe('MindMap.vue', () => {
  it('renders props.msg when passed', () => {
    const msg = 'new message'
    const value = [dataLearn]
    const wrapper = mount(mindmap, {
      propsData: { msg, value }
    })
    expect(wrapper.text()).to.include(msg)
  })
})
